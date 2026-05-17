"""Content Rewriter Agent — rewrites resume content to better match a JD.

Uses scorer output, gap analysis, and JD analysis to produce tailored content.
Preserves truthfulness — only rephrases and reorganizes, never fabricates.
"""

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a professional resume writer. Given the original resume content,
job description analysis, gap analysis, and score results, rewrite the resume to better
match the target job.

CRITICAL RULES:
1. NEVER fabricate experience, skills, or achievements the candidate doesn't have
2. DO rephrase bullets to incorporate relevant keywords from the JD
3. DO reorder sections/bullets to lead with the most relevant items
4. DO strengthen quantification where possible ("managed team" → "managed team of 5")
5. DO add relevant skills from the resume that are mentioned in JD but missing from skills list
6. Keep the same overall structure (contact, summary, experience, education, skills, certs)

Return valid JSON matching this exact ResumeContent schema:
{
  "contact": {"name": "string", "email": "string", "phone": "string|null",
              "linkedin": "string|null", "location": "string|null", "website": "string|null"},
  "summary": "string - tailored professional summary (2-3 sentences)",
  "experience": [
    {"company": "string", "title": "string", "dates": "string",
     "bullets": ["string - tailored bullet points"]}
  ],
  "education": [
    {"institution": "string", "degree": "string", "field": "string",
     "dates": "string", "gpa": "string|null"}
  ],
  "skills": ["string - reordered with JD-relevant skills first"],
  "certifications": [
    {"name": "string", "issuer": "string", "date": "string|null"}
  ]
}

Also return a diff of what you changed:
{
  "content": {<ResumeContent above>},
  "diff": [
    {"section": "string", "original": "string", "tailored": "string"}
  ]
}
"""


async def rewrite_content(
    resume_content: dict,
    jd_analysis: dict,
    gaps: dict,
    score: dict,
    llm_client=None,
) -> dict:
    """Rewrite resume content to better match JD.

    Args:
        resume_content: Original ResumeContent dict.
        jd_analysis: JDAnalysis from jd_analyzer.
        gaps: GapAnalysis from gap_finder.
        score: ScoreResult from scorer.
        llm_client: Optional LLM client for DI.

    Returns:
        Dict with "content" (ResumeContent) and "diff" (list[DiffChange]).
    """
    if llm_client is None:
        from src.agents.llm_client import get_client

        llm_client = get_client()

    prompt = (
        f"Original Resume:\n{json.dumps(resume_content, indent=2)}\n\n"
        f"Job Description Analysis:\n{json.dumps(jd_analysis, indent=2)}\n\n"
        f"Gap Analysis:\n{json.dumps(gaps, indent=2)}\n\n"
        f"Current Score:\n{json.dumps(score, indent=2)}"
    )

    response = await llm_client.generate(
        system=SYSTEM_PROMPT,
        prompt=prompt,
        response_format="json",
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.error("Content rewriter returned invalid JSON: %s", response[:200])
        return {"content": resume_content, "diff": []}

    return _validate_rewrite(result, resume_content)


def _validate_rewrite(data: dict, original: dict) -> dict:
    """Ensure rewrite result has content and diff fields."""
    if "content" not in data:
        # If the LLM returned ResumeContent directly (no wrapper), wrap it
        if "contact" in data and "experience" in data:
            return {"content": data, "diff": []}
        return {"content": original, "diff": []}

    if "diff" not in data or not isinstance(data["diff"], list):
        data["diff"] = []

    return {"content": data["content"], "diff": data["diff"]}
