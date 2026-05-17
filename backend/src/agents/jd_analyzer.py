"""JD Analyzer Agent — parses a job description into structured data.

Uses an LLM to extract: role, company, skills, seniority, keywords, etc.
Returns a JDAnalysis dict matching the frontend schema.
"""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a job description analyzer. Given a raw job description text,
extract structured information and return it as JSON.

You MUST return valid JSON matching this exact schema:
{
  "company": "string - company name",
  "role": "string - job title",
  "seniority_level": "string - entry/mid/senior/lead/principal/director",
  "must_have_skills": ["string - required hard skills"],
  "nice_to_have_skills": ["string - preferred/bonus skills"],
  "required_experience_years": null or integer,
  "required_education": null or "string - degree requirement",
  "key_responsibilities": ["string - main duties"],
  "industry_keywords": ["string - domain-specific terms to include in resume"],
  "soft_skills": ["string - soft skills mentioned"],
  "tone": "string - formal/casual/technical/startup"
}

Rules:
- Extract only what is explicitly stated in the JD
- If a field is not mentioned, use null or empty array
- Industry keywords should be terms an ATS would scan for
- Be precise with seniority detection based on years and title
"""


async def analyze_jd(jd_text: str, llm_client=None) -> dict:
    """Analyze a job description and return structured data.

    Args:
        jd_text: Raw job description text.
        llm_client: Optional LLM client for dependency injection in tests.

    Returns:
        Dict matching JDAnalysis schema.
    """
    if llm_client is None:
        llm_client = _get_default_client()

    response = await llm_client.generate(
        system=SYSTEM_PROMPT,
        prompt=f"Analyze this job description:\n\n{jd_text}",
        response_format="json",
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.error("JD analyzer returned invalid JSON: %s", response[:200])
        result = _empty_analysis()

    return _validate_analysis(result)


def _empty_analysis() -> dict:
    """Return an empty JDAnalysis with all required fields."""
    return {
        "company": "",
        "role": "",
        "seniority_level": "mid",
        "must_have_skills": [],
        "nice_to_have_skills": [],
        "required_experience_years": None,
        "required_education": None,
        "key_responsibilities": [],
        "industry_keywords": [],
        "soft_skills": [],
        "tone": "formal",
    }


def _validate_analysis(data: dict) -> dict:
    """Ensure all required fields are present with correct types."""
    template = _empty_analysis()
    for key, default in template.items():
        if key not in data or (isinstance(default, list) and not isinstance(data[key], list)):
            data[key] = default
    return data


def _get_default_client():
    """Get the default LLM client. Lazy import to avoid startup cost."""
    from src.agents.llm_client import get_client

    return get_client()
