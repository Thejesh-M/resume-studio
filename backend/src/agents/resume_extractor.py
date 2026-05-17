"""Resume Extraction Agent — multimodal extraction via Gemini 2.5 Flash.

Strategy:
  PDF  → upload raw bytes to Gemini Files API → pass file_uri in prompt.
          Gemini reads layout, columns, tables natively — no text extraction needed.
  DOCX → caller supplies pre-extracted text (python-docx is reliable for DOCX structure).

Both paths retry up to MAX_RETRIES times before returning None, at which point
resume_service falls back to the heuristic parser so the user always gets a result.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
from typing import Any

from src.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Substrings from Gemini API errors that indicate a password-protected PDF.
# Retrying these is pointless — surface immediately to the user.
_PASSWORD_ERROR_HINTS = (
    "password",
    "encrypted",
    "permission",
    "protected",
)


def _is_password_error(exc: Exception) -> bool:
    """Return True if the exception indicates a password-protected PDF."""
    msg = str(exc).lower()
    return any(hint in msg for hint in _PASSWORD_ERROR_HINTS)

MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds between retries

def _extraction_model() -> str:
    """Gemini-specific extraction model (used only when provider == 'gemini')."""
    from src.core.config import settings

    return settings.gemini_model

# Hard cap for DOCX text path (chars, not tokens).
# A typical resume is 3 000–6 000 chars; 20 000 covers the longest academic CVs.
_MAX_TEXT_CHARS = 20_000

SYSTEM_PROMPT = """\
You are an expert resume parser.

Your task is to extract every piece of information from the provided resume and return it
as a single valid JSON object matching the schema below.

RULES:
1. Extract ONLY what is present — never fabricate or infer missing data.
2. If a field is absent, emit null or [] — NEVER a placeholder like "N/A" or "TBD".
3. Group skills into named categories inferred from context (e.g. "Backend", "Frontend",
   "Cloud & DevOps", "AI/ML", "Tools"). Use "General" if no clear grouping exists.
4. Preserve original date strings exactly as written (e.g. "Jan 2021 – Mar 2023").
5. Keep bullet text verbatim or lightly cleaned (trim whitespace, fix encoding artefacts).
6. Return valid JSON ONLY — no markdown fences, no commentary, no trailing commas.

SCHEMA (return exactly this shape, no extra keys):
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "linkedin": "string | null",
    "location": "string | null",
    "website": "string | null",
    "github": "string | null",
    "address": "string | null",
    "titles": ["string"]
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "dates": "string",
      "gpa": "string | null"
    }
  ],
  "skills": [
    { "category": "string", "items": ["string"] }
  ],
  "certifications": [
    { "name": "string", "issuer": "string", "date": "string | null" }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "url": "string | null",
      "dates": "string | null",
      "highlights": ["string"]
    }
  ],
  "awards": [
    {
      "title": "string",
      "issuer": "string",
      "date": "string | null",
      "description": "string | null"
    }
  ],
  "publications": [
    {
      "title": "string",
      "venue": "string",
      "date": "string | null",
      "url": "string | null",
      "authors": "string | null"
    }
  ],
  "languages": [
    { "language": "string", "proficiency": "string | null" }
  ],
  "interests": ["string"],
  "volunteers": [
    {
      "organization": "string",
      "role": "string",
      "dates": "string | null",
      "description": "string | null"
    }
  ],
  "affiliations": [
    { "organization": "string", "role": "string | null", "dates": "string | null" }
  ],
  "references": [
    {
      "name": "string",
      "title": "string | null",
      "contact": "string | null",
      "relationship": "string | null"
    }
  ]
}
"""


# ── Public API ────────────────────────────────────────────────────────────────


async def extract_from_pdf(pdf_bytes: bytes) -> dict[str, Any] | None:
    """Extract structured resume content from a PDF.

    With ``LLM_PROVIDER=gemini`` we upload the PDF to the Gemini Files API and
    let Gemini read it natively (best fidelity for multi-column resumes).

    With any other provider we fall back to extracting PDF text with PyMuPDF
    and feeding the text through the shared LLM abstraction.

    Returns ``None`` on complete failure; the caller is expected to fall back
    to the heuristic parser in that case.
    """
    from src.core.config import settings

    if settings.llm_provider != "gemini" or not settings.gemini_api_key:
        # Generic path — extract text and send to whichever provider is configured.
        try:
            import pymupdf  # type: ignore

            with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
                text = "\n\n".join(page.get_text() for page in doc)
        except Exception:
            logger.exception("Failed to extract text from PDF")
            return None
        return await extract_from_docx_text(text)

    client = _get_genai_client()

    for attempt in range(1, MAX_RETRIES + 1):
        file_resource = None
        try:
            file_resource = await _upload_pdf(client, pdf_bytes)
            result = await _generate_from_file(client, file_resource.uri)
            parsed = _parse_and_validate(result)
            if parsed is not None:
                return parsed
            logger.warning("Attempt %d/%d: extractor returned invalid structure", attempt, MAX_RETRIES)
        except ValidationError:
            # Already a user-facing error (e.g. password-protected) — propagate immediately.
            raise
        except Exception as exc:
            if _is_password_error(exc):
                raise ValidationError(
                    "This PDF is password-protected. Please remove the password and upload again."
                ) from exc
            logger.exception("Attempt %d/%d: PDF extraction failed", attempt, MAX_RETRIES)
        finally:
            if file_resource is not None:
                await _delete_file_safe(client, file_resource.name)

        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY * attempt)

    logger.error("PDF extraction failed after %d attempts — returning None", MAX_RETRIES)
    return None


async def extract_from_docx_text(raw_text: str) -> dict[str, Any] | None:
    """Extract structured resume content from plain text.

    Sends the text through the configured LLM provider (Gemini, OpenAI,
    Anthropic, or Ollama). Returns ``None`` on complete failure so the caller
    can fall back to the heuristic parser.
    """
    from src.core.llm import LLMUnavailable, get_llm

    truncated = raw_text[:_MAX_TEXT_CHARS]
    if len(raw_text) > _MAX_TEXT_CHARS:
        logger.warning(
            "Text truncated from %d to %d chars before extraction",
            len(raw_text),
            _MAX_TEXT_CHARS,
        )

    prompt = f"Extract the resume from the following text:\n\n{truncated}"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = await get_llm().generate(SYSTEM_PROMPT, prompt, "json")
            parsed = _parse_and_validate(result)
            if parsed is not None:
                return parsed
            logger.warning(
                "Attempt %d/%d: extractor returned invalid structure", attempt, MAX_RETRIES
            )
        except LLMUnavailable as exc:
            logger.warning("LLM unavailable for extraction: %s", exc)
            return None
        except Exception:
            logger.exception("Attempt %d/%d: text extraction failed", attempt, MAX_RETRIES)

        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY * attempt)

    logger.error("Text extraction failed after %d attempts — returning None", MAX_RETRIES)
    return None


# ── Internal helpers ──────────────────────────────────────────────────────────


def _get_genai_client():
    """Return an authenticated Gemini client.

    Auth priority (matches google-genai SDK behaviour):
      1. GEMINI_API_KEY in settings / env  → API key auth (local dev, CI)
      2. GOOGLE_APPLICATION_CREDENTIALS    → Service account (production GCP)
      3. Application Default Credentials   → `gcloud auth application-default login`
    """
    from google import genai
    from src.core.config import settings

    if settings.gemini_api_key:
        return genai.Client(api_key=settings.gemini_api_key)
    return genai.Client()


async def _upload_pdf(client, pdf_bytes: bytes):
    """Upload PDF bytes to the Gemini Files API and return the File resource."""
    from google.genai import types

    file_like = io.BytesIO(pdf_bytes)
    file_resource = await client.aio.files.upload(
        file=file_like,
        config=types.UploadFileConfig(
            mime_type="application/pdf",
            display_name="resume.pdf",
        ),
    )
    logger.debug("Uploaded resume PDF to Files API: %s", file_resource.name)
    return file_resource


async def _generate_from_file(client, file_uri: str) -> str:
    """Send a file_data part referencing the uploaded PDF and get the LLM response."""
    from google.genai import types

    response = await client.aio.models.generate_content(
        model=_extraction_model(),
        contents=[
            types.Part(
                file_data=types.FileData(
                    mime_type="application/pdf",
                    file_uri=file_uri,
                )
            ),
            types.Part(text="Extract the resume from this document."),
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    return response.text


async def _generate_from_text(client, text: str) -> str:
    """Send plain text to Gemini and get the LLM response."""
    from google.genai import types

    prompt = f"Extract the resume from the following text:\n\n{text}"

    response = await client.aio.models.generate_content(
        model=_extraction_model(),
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    return response.text


async def _delete_file_safe(client, file_name: str) -> None:
    """Delete a Files API resource, ignoring errors (best-effort cleanup)."""
    try:
        await client.aio.files.delete(name=file_name)
        logger.debug("Deleted Files API resource: %s", file_name)
    except Exception:
        logger.warning("Failed to delete Files API resource %s (non-fatal)", file_name)


def _parse_and_validate(response_text: str) -> dict[str, Any] | None:
    """Parse JSON response and do a minimal sanity check.

    Returns the dict if valid, None otherwise.
    """
    try:
        data = json.loads(response_text)
    except json.JSONDecodeError:
        logger.error(
            "Extractor returned invalid JSON (first 300 chars): %.300s",
            response_text,
        )
        return None

    if not isinstance(data, dict):
        logger.error("Extractor returned non-dict JSON: %s", type(data))
        return None

    if "contact" not in data:
        logger.error("Extractor response missing 'contact' key: %.200s", str(data))
        return None

    return data
