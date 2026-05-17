"""Orchestrator — runs the full tailoring pipeline.

Pipeline:
  1. JD Analyzer → structured JD data
  2. Scorer + Gap Finder (parallel) → score + gaps
  3. Content Rewriter → tailored resume content
  4. Compiler → Typst source + PDF

Updates Firestore progress at each stage.
"""

import asyncio
import logging

from src.agents import compiler, content_rewriter, gap_finder, jd_analyzer, scorer
from src.core import firestore

logger = logging.getLogger(__name__)


async def run_pipeline(
    task_id: str,
    resume_content: dict,
    jd_text: str,
    template_id: str,
    llm_client=None,
) -> dict:
    """Run the full tailoring pipeline.

    Args:
        task_id: Firestore task ID for progress tracking.
        resume_content: Original ResumeContent dict.
        jd_text: Raw job description text.
        template_id: Template category for compilation.
        llm_client: Optional LLM client for DI in tests.

    Returns:
        Dict with keys: tailored_content, typst_source, pdf_bytes,
        score_before, score_after, diff, jd_analysis.
    """
    # Stage 1: Analyze JD
    await firestore.update_task_status(task_id, "Analyzing job description", 10)
    jd_analysis = await jd_analyzer.analyze_jd(jd_text, llm_client)

    # Stage 2: Score + Find Gaps (parallel)
    await firestore.update_task_status(task_id, "Scoring resume and finding gaps", 30)
    score_before_result, gaps_result = await asyncio.gather(
        scorer.score_resume(resume_content, jd_analysis, llm_client),
        gap_finder.find_gaps(resume_content, jd_analysis, llm_client),
    )

    # Stage 3: Rewrite content
    await firestore.update_task_status(task_id, "Tailoring resume content", 60)
    rewrite_result = await content_rewriter.rewrite_content(
        resume_content, jd_analysis, gaps_result, score_before_result, llm_client
    )

    tailored_content = rewrite_result["content"]
    diff = rewrite_result["diff"]

    # Stage 4: Score after (to show improvement)
    await firestore.update_task_status(task_id, "Calculating final score", 75)
    score_after_result = await scorer.score_resume(
        tailored_content, jd_analysis, llm_client
    )

    # Stage 5: Compile to PDF
    await firestore.update_task_status(task_id, "Compiling PDF", 85)
    try:
        typst_source, pdf_bytes = await compiler.compile_typst(
            template_id, tailored_content
        )
    except RuntimeError as e:
        logger.warning("PDF compilation failed, continuing without PDF: %s", e)
        typst_source = ""
        pdf_bytes = b""

    await firestore.update_task_status(task_id, "Finalizing", 95)

    return {
        "tailored_content": tailored_content,
        "typst_source": typst_source,
        "pdf_bytes": pdf_bytes,
        "score_before": score_before_result["overall_score"],
        "score_after": score_after_result["overall_score"],
        "diff": diff,
        "jd_analysis": jd_analysis,
    }
