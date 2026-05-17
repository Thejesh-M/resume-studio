"""Scorer Agent — scores a resume against a job description.

Returns a ScoreResult with overall score, breakdown, summary, and quick wins.
"""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a resume-JD scoring expert. Given a resume and a job description
analysis, score how well the resume matches the job requirements.

Return valid JSON matching this schema:
{
  "overall_score": float (0-100),
  "breakdown": {
    "keyword_match": float (0-100),
    "experience_alignment": float (0-100),
    "skills_coverage": float (0-100),
    "education_match": float (0-100),
    "quantification": float (0-100),
    "section_completeness": float (0-100)
  },
  "summary": "string - 2-3 sentence assessment",
  "quick_wins": [
    {"suggestion": "string - specific actionable improvement", "impact": "high|medium|low"}
  ]
}

Scoring guidelines:
- keyword_match: % of JD industry keywords found in resume
- experience_alignment: how well experience matches key responsibilities
- skills_coverage: % of must-have + nice-to-have skills present
- education_match: does education meet requirements (100 if no requirement)
- quantification: % of bullet points with measurable results
- section_completeness: are all standard sections present and filled
- overall_score: weighted average (keywords 25%, experience 25%, skills 20%, others 10% each)
- quick_wins: 3-5 highest-impact suggestions, sorted by impact
"""


async def score_resume(
    resume_content: dict,
    jd_analysis: dict,
    llm_client=None,
) -> dict:
    """Score a resume against JD analysis.

    Args:
        resume_content: ResumeContent dict.
        jd_analysis: JDAnalysis dict from jd_analyzer.
        llm_client: Optional LLM client for DI.

    Returns:
        Dict matching ScoreResult schema.
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
        logger.error("Scorer returned invalid JSON: %s", response[:200])
        result = _empty_score()

    return _validate_score(result)


def _empty_score() -> dict:
    return {
        "overall_score": 0,
        "breakdown": {
            "keyword_match": 0,
            "experience_alignment": 0,
            "skills_coverage": 0,
            "education_match": 0,
            "quantification": 0,
            "section_completeness": 0,
        },
        "summary": "Unable to score — analysis failed.",
        "quick_wins": [],
    }


def _validate_score(data: dict) -> dict:
    template = _empty_score()
    for key, default in template.items():
        if key not in data:
            data[key] = default
    if "breakdown" in data and isinstance(data["breakdown"], dict):
        for key, default in template["breakdown"].items():
            if key not in data["breakdown"]:
                data["breakdown"][key] = default
    return data
