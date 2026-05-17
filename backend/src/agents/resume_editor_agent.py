"""Resume Editor Agent — conversational AI assistant for editing resume content.

Given a user message and the current resume content, the agent:
1. Understands the user's intent (add, remove, rewrite, reorder sections, etc.)
2. Applies the changes to the content
3. Returns a friendly reply, the updated content, and a list of changed section names.

This agent is used by the split-screen AI editor at /resumes/{id}/editor.
"""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert resume writing assistant embedded in a live resume editor.
The user will send you a natural-language instruction about their resume, and you will apply the changes.

CRITICAL RULES:
1. NEVER fabricate experience, education, or credentials the candidate does not have.
2. DO rephrase, reorder, add, or remove content as requested.
3. DO keep tone professional and concise.
4. When the user asks to "improve", "strengthen", or "make better" — enhance clarity and impact.
5. When the user asks for keywords or skills related to a role, you may SUGGEST adding them, but
   only add them if they are plausibly within the candidate's profile.
6. Skills must remain in category groups: [{"category": "...", "items": ["..."]}].
7. If the user's request is ambiguous, make the most reasonable change and note it in your reply.

SECTION REMOVAL RULES:
- When the user asks to "remove" or "delete" a section (summary, objective, skills, etc.), you MUST
  clear its content — even if it already appears empty. The template may still render a heading for
  sections that exist as empty strings.
- To remove the summary/objective section: set "summary" to "" (empty string).
- To remove a list section (experience, education, skills, certifications, projects, awards,
  publications, languages, interests, volunteers, references, affiliations): set it to an empty array [].
- ALWAYS confirm the removal in your reply and list the section in "changed", even if the value
  was already empty. The user sees the rendered PDF, not the raw JSON — they expect a visible change.
- The template calls the "summary" field different things depending on the template variant:
  "Summary", "Objective", "About", "Professional Summary". Treat ALL of these as the "summary" field.

RESPONSE FORMAT — return valid JSON with this exact shape:
{
  "reply": "string — friendly 1-2 sentence confirmation of what you changed",
  "updated_content": { <full ResumeContent object> },
  "changed": ["section names that were modified, e.g. 'summary', 'experience', 'skills'"]
}

ResumeContent schema:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string|null",
    "linkedin": "string|null",
    "location": "string|null",
    "website": "string|null",
    "github": "string|null",
    "address": "string|null",
    "titles": ["string"]|null
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
      "gpa": "string|null"
    }
  ],
  "skills": [
    {
      "category": "string",
      "items": ["string"]
    }
  ],
  "certifications": [{"name": "string", "issuer": "string", "date": "string|null"}],
  "projects": [{"name": "string", "description": "string", "url": "string|null", "dates": "string|null", "highlights": ["string"]}],
  "awards": [{"title": "string", "issuer": "string", "date": "string|null", "description": "string|null"}],
  "publications": [{"title": "string", "venue": "string", "date": "string|null", "url": "string|null", "authors": "string|null"}],
  "languages": [{"language": "string", "proficiency": "string|null"}],
  "interests": ["string"],
  "volunteers": [{"organization": "string", "role": "string", "dates": "string|null", "description": "string|null"}],
  "references": [{"name": "string", "title": "string|null", "contact": "string|null", "relationship": "string|null"}],
  "affiliations": [{"organization": "string", "role": "string|null", "dates": "string|null"}]
}
"""


async def chat(
    message: str,
    current_content: dict,
    llm_client=None,
) -> dict:
    """Process a user message and return updated resume content.

    Args:
        message: The user's natural-language instruction.
        current_content: The current ResumeContent as a dict.
        llm_client: Optional LLM client for dependency injection.

    Returns:
        Dict with keys: reply (str), updated_content (dict), changed (list[str]).
    """
    if llm_client is None:
        from src.agents.llm_client import get_client

        llm_client = get_client()

    prompt = (
        f"Current resume content:\n{json.dumps(current_content, indent=2)}\n\n"
        f"User instruction: {message}"
    )

    response = await llm_client.generate(
        system=SYSTEM_PROMPT,
        prompt=prompt,
        response_format="json",
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.error("Resume editor agent returned invalid JSON: %s", response[:200])
        return {
            "reply": "I had trouble processing that request. Please try again.",
            "updated_content": current_content,
            "changed": [],
        }

    return _validate_response(result, current_content)


def _validate_response(data: dict, original_content: dict) -> dict:
    """Ensure the agent response has all required fields."""
    if not isinstance(data, dict):
        return {
            "reply": "Something went wrong. Please try again.",
            "updated_content": original_content,
            "changed": [],
        }

    updated = data.get("updated_content")
    if not isinstance(updated, dict) or "contact" not in updated:
        updated = original_content

    reply = data.get("reply", "Done!")
    if not isinstance(reply, str):
        reply = "Done!"

    changed = data.get("changed", [])
    if not isinstance(changed, list):
        changed = []

    return {
        "reply": reply,
        "updated_content": updated,
        "changed": [str(c) for c in changed],
    }
