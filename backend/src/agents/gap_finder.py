"""Gap Finder Agent — identifies gaps between resume and job description.

Returns a GapAnalysis with missing skills, weak bullets, keywords, and experience gaps.
"""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a resume gap analysis expert. Given a resume and a job description
analysis, identify specific gaps and improvement areas.

Return valid JSON matching this schema:
{
  "missing_hard_skills": [
    {"skill": "string", "importance": "must_have|nice_to_have",
     "suggestion": "string - how to address"}
  ],
  "weak_bullets": [
    {"bullet": "string - the original bullet",
     "issue": "string - what's wrong",
     "jd_alignment": "low|medium|high"}
  ],
  "missing_keywords": ["string - JD keywords not found in resume"],
  "experience_gaps": ["string - experience areas the JD requires but resume lacks"],
  "strengths_to_emphasize": ["string - existing strengths that align well with JD"]
}

Guidelines:
- Focus on actionable gaps, not generic advice
- missing_hard_skills: skills from JD not in resume. Must-have are critical
- weak_bullets: bullets that could be stronger or more relevant to JD
- missing_keywords: ATS-critical terms from JD not in resume text
- experience_gaps: role responsibilities the resume doesn't demonstrate
- strengths_to_emphasize: what the candidate already has that matches well
"""


async def find_gaps(
    resume_content: dict,
    jd_analysis: dict,
    llm_client=None,
) -> dict:
    """Find gaps between resume and JD.

    Args:
        resume_content: ResumeContent dict.
        jd_analysis: JDAnalysis dict from jd_analyzer.
        llm_client: Optional LLM client for DI.

    Returns:
        Dict matching GapAnalysis schema.
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
        logger.error("Gap finder returned invalid JSON: %s", response[:200])
        result = _empty_gaps()

    return _validate_gaps(result)


def _empty_gaps() -> dict:
    return {
        "missing_hard_skills": [],
        "weak_bullets": [],
        "missing_keywords": [],
        "experience_gaps": [],
        "strengths_to_emphasize": [],
    }


def _validate_gaps(data: dict) -> dict:
    template = _empty_gaps()
    for key, default in template.items():
        if key not in data or not isinstance(data[key], list):
            data[key] = default
    return data
