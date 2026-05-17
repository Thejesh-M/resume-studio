from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

# --- JD Analysis (matches frontend JDAnalysis) ---


class JDAnalysis(BaseModel):
    company: str
    role: str
    seniority_level: str
    must_have_skills: list[str]
    nice_to_have_skills: list[str]
    required_experience_years: int | None = None
    required_education: str | None = None
    key_responsibilities: list[str]
    industry_keywords: list[str]
    soft_skills: list[str]
    tone: str


# --- Gap Analysis (matches frontend GapAnalysis) ---


class MissingSkill(BaseModel):
    skill: str
    importance: str  # must_have | nice_to_have
    suggestion: str


class WeakBullet(BaseModel):
    bullet: str
    issue: str
    jd_alignment: str  # low | medium | high


class GapAnalysis(BaseModel):
    missing_hard_skills: list[MissingSkill]
    weak_bullets: list[WeakBullet]
    missing_keywords: list[str]
    experience_gaps: list[str]
    strengths_to_emphasize: list[str]


# --- Score (matches frontend ScoreResult) ---


class ScoreBreakdown(BaseModel):
    keyword_match: float
    experience_alignment: float
    skills_coverage: float
    education_match: float
    quantification: float
    section_completeness: float


class QuickWin(BaseModel):
    suggestion: str
    impact: str  # high | medium | low


class ScoreResult(BaseModel):
    overall_score: float
    breakdown: ScoreBreakdown
    summary: str
    quick_wins: list[QuickWin]


# --- Diff ---


class DiffChange(BaseModel):
    section: str
    original: str
    tailored: str


# --- Requests ---


class TailoringStartRequest(BaseModel):
    resume_id: UUID
    jd_text: str


class GapAnalysisRequest(BaseModel):
    resume_id: UUID
    jd_text: str


# --- Responses ---


class TailoringStartResponse(BaseModel):
    task_id: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    current_step: str
    progress_pct: int


class TailoredVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_resume_id: UUID
    jd_id: UUID
    status: str
    tailored_content: dict | None = None
    pdf_url: str | None = None
    score_before: float | None = None
    score_after: float | None = None
    diff: list[DiffChange] | None = None
    credits_used: int
    created_at: datetime


class JobDescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    company: str
    raw_text: str
    agent_analysis: JDAnalysis | None = None
    source_url: str | None = None
    created_at: datetime


class GapAnalysisResponse(BaseModel):
    gaps: GapAnalysis
    score: ScoreResult
