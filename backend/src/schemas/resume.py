from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

# --- Resume content sub-schemas (matches frontend ResumeContent) ---


class ContactInfo(BaseModel):
    name: str
    email: str
    phone: str | None = None
    linkedin: str | None = None
    location: str | None = None
    website: str | None = None
    github: str | None = None
    address: str | None = None
    titles: list[str] | None = None


class ExperienceEntry(BaseModel):
    company: str
    title: str
    dates: str | None = None  # null for current positions
    bullets: list[str] = []


class EducationEntry(BaseModel):
    institution: str
    degree: str
    field: str | None = None  # not all degrees have a named field of study
    dates: str | None = None
    gpa: str | None = None


class CertificationEntry(BaseModel):
    name: str
    issuer: str | None = None
    date: str | None = None


class SkillGroup(BaseModel):
    category: str
    items: list[str]


class ProjectEntry(BaseModel):
    name: str
    description: str = ""
    url: str | None = None
    dates: str | None = None
    highlights: list[str] = []


class AwardEntry(BaseModel):
    title: str
    issuer: str | None = None
    date: str | None = None
    description: str | None = None


class PublicationEntry(BaseModel):
    title: str
    venue: str | None = None
    date: str | None = None
    url: str | None = None
    authors: str | None = None


class LanguageEntry(BaseModel):
    language: str
    proficiency: str | None = None


class VolunteerEntry(BaseModel):
    organization: str
    role: str
    dates: str | None = None
    description: str | None = None


class ReferenceEntry(BaseModel):
    name: str
    title: str | None = None
    contact: str | None = None
    relationship: str | None = None


class AffiliationEntry(BaseModel):
    organization: str
    role: str | None = None
    dates: str | None = None


DEFAULT_SECTION_ORDER: list[str] = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "awards",
    "publications",
    "languages",
    "interests",
    "volunteers",
    "affiliations",
    "references",
]


class ResumeContent(BaseModel):
    contact: ContactInfo
    summary: str = ""
    experience: list[ExperienceEntry] = []
    education: list[EducationEntry] = []
    skills: list[SkillGroup] = []
    certifications: list[CertificationEntry] = []
    projects: list[ProjectEntry] = []
    awards: list[AwardEntry] = []
    publications: list[PublicationEntry] = []
    languages: list[LanguageEntry] = []
    interests: list[str] = []
    volunteers: list[VolunteerEntry] = []
    references: list[ReferenceEntry] = []
    affiliations: list[AffiliationEntry] = []
    section_order: list[str] = list(DEFAULT_SECTION_ORDER)

    @field_validator("summary", mode="before")
    @classmethod
    def coerce_summary(cls, v: object) -> str:
        """Gemini may return null when the resume has no summary section."""
        return v if isinstance(v, str) else ""

    @field_validator("section_order", mode="before")
    @classmethod
    def normalise_section_order(cls, v: object) -> list[str]:
        """Ensure section_order contains exactly the known sections in a valid order.

        - Unknown keys are stripped.
        - Missing known keys are appended at the end in default order.
        - None / non-list values fall back to the default.
        """
        if not isinstance(v, list):
            return list(DEFAULT_SECTION_ORDER)
        valid = [s for s in v if isinstance(s, str) and s in DEFAULT_SECTION_ORDER]
        # Append any sections that were missing (e.g. newly added section types)
        seen = set(valid)
        for s in DEFAULT_SECTION_ORDER:
            if s not in seen:
                valid.append(s)
        return valid

    @field_validator("skills", mode="before")
    @classmethod
    def normalise_skills(cls, v: object) -> list:
        """Accept both legacy list[str] and new list[SkillGroup] from DB."""
        if not isinstance(v, list):
            return []
        if v and isinstance(v[0], str):
            # Migrate flat list to a single "General" group
            return [{"category": "General", "items": v}]
        return v


# --- Request / Response schemas ---


class ExtractionResult(BaseModel):
    """Returned by POST /resumes/extract.

    extraction_id is a temporary folder key in local storage used to link the
    raw upload and extraction snapshot to the resume once the user confirms.
    """

    content: ResumeContent
    extraction_id: str


# Kept for backward compatibility — prefer ExtractionResult in new code
ResumeExtractResponse = ExtractionResult


class ResumeCreateRequest(BaseModel):
    title: str
    template_id: UUID
    content: ResumeContent
    extraction_id: str | None = None  # links temp upload files to the new resume


class ResumeUpdateRequest(BaseModel):
    title: str | None = None
    content: ResumeContent | None = None
    template_id: UUID | None = None
    is_default: bool | None = None


class ThemeOverrides(BaseModel):
    """Delta of theme keys the user has changed from the template default.

    All fields are optional — only keys present in the dict are stored /
    applied. An empty ThemeOverrides clears all overrides.
    """

    # Colours
    accent: str | None = None
    accent_light: str | None = None  # serialised as "accent-light"
    text: str | None = None
    subtle: str | None = None
    # Typography
    body_font: str | None = None       # "body-font"
    heading_font: str | None = None    # "heading-font"
    font_size: str | None = None       # "font-size"   e.g. "10pt"
    name_size: str | None = None       # "name-size"   e.g. "22pt"
    section_size: str | None = None    # "section-size" e.g. "1.05em"
    # Layout
    page_size: str | None = None       # "page-size"   "us-letter" | "a4"
    margin_top: str | None = None      # "margin-top"  e.g. "0.5in"
    margin_bottom: str | None = None   # "margin-bottom"
    margin_sides: str | None = None    # "margin-sides"
    line_spacing: str | None = None    # "line-spacing" e.g. "1.1em"
    section_spacing: str | None = None # "section-spacing" e.g. "6pt"

    def to_typst_dict(self) -> dict:
        """Return a dict with hyphenated Typst key names, excluding None values."""
        mapping = {
            "accent": self.accent,
            "accent-light": self.accent_light,
            "text": self.text,
            "subtle": self.subtle,
            "body-font": self.body_font,
            "heading-font": self.heading_font,
            "font-size": self.font_size,
            "name-size": self.name_size,
            "section-size": self.section_size,
            "page-size": self.page_size,
            "margin-top": self.margin_top,
            "margin-bottom": self.margin_bottom,
            "margin-sides": self.margin_sides,
            "line-spacing": self.line_spacing,
            "section-spacing": self.section_spacing,
        }
        return {k: v for k, v in mapping.items() if v is not None}


class TemplateSwitchRequest(BaseModel):
    """Switch the template for an existing resume."""

    template_id: UUID


class CompileRequest(BaseModel):
    content: ResumeContent | None = None


class ChatRequest(BaseModel):
    message: str
    current_content: ResumeContent


class ChatResponse(BaseModel):
    reply: str
    updated_content: ResumeContent
    changed: list[str]
    template_changed: bool = False


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    # Raw-PDF uploads have neither template nor structured content.
    template_id: UUID | None = None
    content: ResumeContent | None = None
    compiled_source: str | None = None
    base_pdf_url: str | None = None
    theme_overrides: dict | None = None
    is_default: bool
    is_raw_upload: bool = False
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_model(cls, obj) -> "ResumeResponse":
        """Convert ORM model to response."""
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            title=obj.title,
            template_id=obj.template_id,
            content=obj.content,
            compiled_source=obj.source_url,
            base_pdf_url=obj.base_pdf_url,
            theme_overrides=obj.theme_overrides,
            is_default=obj.is_default,
            is_raw_upload=getattr(obj, "is_raw_upload", False),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )
