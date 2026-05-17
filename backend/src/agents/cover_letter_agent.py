"""Cover Letter Agent — generates a tailored cover letter from resume + JD."""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert cover letter writer. Given a resume and job description analysis,
write a compelling, personalized cover letter that:
- Opens with a strong hook related to the specific role/company
- Highlights 2-3 of the candidate's most relevant achievements (with numbers)
- Addresses the top 3 must-have requirements from the JD
- Matches the tone of the company (startup = energetic, enterprise = professional)
- Ends with a clear call to action
- Is 3-4 paragraphs, ~300-350 words

Return valid JSON:
{
  "subject_line": "string - email subject line",
  "salutation": "string - e.g. 'Dear Hiring Manager,'",
  "body": "string - full cover letter body with paragraph breaks (\\n\\n)",
  "closing": "string - e.g. 'Best regards,'"
}

Do NOT include the candidate's name/signature — the frontend handles that.
"""


async def generate(
    resume_content: dict,
    jd_analysis: dict,
    llm_client=None,
) -> dict:
    """Generate a cover letter.

    Args:
        resume_content: ResumeContent dict from the user's resume.
        jd_analysis: JDAnalysis dict from jd_analyzer agent.
        llm_client: Optional LLM client for DI.

    Returns:
        Dict with subject_line, salutation, body, closing.
    """
    if llm_client is None:
        from src.agents.llm_client import get_client

        llm_client = get_client()

    prompt = (
        f"Resume:\n{json.dumps(resume_content, indent=2)}\n\n"
        f"Job Description Analysis:\n{json.dumps(jd_analysis, indent=2)}"
    )

    response = await llm_client.generate(
        system=SYSTEM_PROMPT,
        prompt=prompt,
        response_format="json",
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.error("Cover letter agent returned invalid JSON: %s", response[:200])
        result = _fallback(jd_analysis)

    return _validate(result, jd_analysis)


def _fallback(jd_analysis: dict) -> dict:
    role = jd_analysis.get("role", "the position")
    company = jd_analysis.get("company", "your company")
    return {
        "subject_line": f"Application for {role} at {company}",
        "salutation": "Dear Hiring Manager,",
        "body": (
            f"I am writing to express my interest in the {role} position at {company}. "
            "Based on my experience and skills, I believe I would be a strong fit for this role.\n\n"
            "I look forward to discussing how my background aligns with your needs."
        ),
        "closing": "Best regards,",
    }


def _validate(result: dict, jd_analysis: dict) -> dict:
    fallback = _fallback(jd_analysis)
    return {
        "subject_line": result.get("subject_line") or fallback["subject_line"],
        "salutation": result.get("salutation") or fallback["salutation"],
        "body": result.get("body") or fallback["body"],
        "closing": result.get("closing") or fallback["closing"],
    }
