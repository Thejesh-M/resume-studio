"""Tests for AI agents with mocked LLM client."""

import json

import pytest

from unittest.mock import AsyncMock, MagicMock, patch

from src.agents import (
    auto_apply_agent,
    content_rewriter,
    gap_finder,
    jd_analyzer,
    job_ranker,
    question_suggester,
    scorer,
)


class MockLLMClient:
    """Mock LLM client that returns predetermined JSON responses."""

    def __init__(self, response: dict):
        self._response = json.dumps(response)

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        return self._response


class BadLLMClient:
    """Mock LLM client that returns invalid JSON."""

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        return "not valid json at all"


# --- JD Analyzer Tests ---


@pytest.mark.asyncio
async def test_jd_analyzer_valid():
    mock_response = {
        "company": "TechCorp",
        "role": "Software Engineer",
        "seniority_level": "mid",
        "must_have_skills": ["Python", "FastAPI"],
        "nice_to_have_skills": ["Docker"],
        "required_experience_years": 3,
        "required_education": "BS in CS",
        "key_responsibilities": ["Build APIs"],
        "industry_keywords": ["microservices", "REST"],
        "soft_skills": ["teamwork"],
        "tone": "formal",
    }
    client = MockLLMClient(mock_response)
    result = await jd_analyzer.analyze_jd("Some JD text", llm_client=client)

    assert result["company"] == "TechCorp"
    assert result["role"] == "Software Engineer"
    assert "Python" in result["must_have_skills"]


@pytest.mark.asyncio
async def test_jd_analyzer_invalid_json():
    client = BadLLMClient()
    result = await jd_analyzer.analyze_jd("Some JD text", llm_client=client)

    # Should return empty analysis, not crash
    assert result["company"] == ""
    assert result["must_have_skills"] == []


@pytest.mark.asyncio
async def test_jd_analyzer_missing_fields():
    """Missing fields should be filled with defaults."""
    client = MockLLMClient({"company": "Acme", "role": "Dev"})
    result = await jd_analyzer.analyze_jd("JD text", llm_client=client)

    assert result["company"] == "Acme"
    assert result["must_have_skills"] == []
    assert result["seniority_level"] == "mid"


# --- Scorer Tests ---


@pytest.mark.asyncio
async def test_scorer_valid():
    mock_response = {
        "overall_score": 72,
        "breakdown": {
            "keyword_match": 60,
            "experience_alignment": 80,
            "skills_coverage": 70,
            "education_match": 100,
            "quantification": 40,
            "section_completeness": 80,
        },
        "summary": "Good match overall.",
        "quick_wins": [
            {"suggestion": "Add Docker to skills", "impact": "high"},
        ],
    }
    client = MockLLMClient(mock_response)
    result = await scorer.score_resume({}, {}, llm_client=client)

    assert result["overall_score"] == 72
    assert result["breakdown"]["keyword_match"] == 60
    assert len(result["quick_wins"]) == 1


@pytest.mark.asyncio
async def test_scorer_invalid_json():
    client = BadLLMClient()
    result = await scorer.score_resume({}, {}, llm_client=client)

    assert result["overall_score"] == 0
    assert result["summary"] == "Unable to score — analysis failed."


# --- Gap Finder Tests ---


@pytest.mark.asyncio
async def test_gap_finder_valid():
    mock_response = {
        "missing_hard_skills": [
            {"skill": "Docker", "importance": "must_have", "suggestion": "Add to skills"}
        ],
        "weak_bullets": [],
        "missing_keywords": ["microservices"],
        "experience_gaps": ["System design"],
        "strengths_to_emphasize": ["API development"],
    }
    client = MockLLMClient(mock_response)
    result = await gap_finder.find_gaps({}, {}, llm_client=client)

    assert len(result["missing_hard_skills"]) == 1
    assert result["missing_hard_skills"][0]["skill"] == "Docker"
    assert "microservices" in result["missing_keywords"]


@pytest.mark.asyncio
async def test_gap_finder_invalid_json():
    client = BadLLMClient()
    result = await gap_finder.find_gaps({}, {}, llm_client=client)

    assert result["missing_hard_skills"] == []
    assert result["missing_keywords"] == []


# --- Content Rewriter Tests ---


@pytest.mark.asyncio
async def test_content_rewriter_valid():
    original = {
        "contact": {"name": "John", "email": "john@test.com"},
        "summary": "Engineer",
        "experience": [],
        "education": [],
        "skills": ["Python"],
        "certifications": [],
    }
    mock_response = {
        "content": {
            "contact": {"name": "John", "email": "john@test.com"},
            "summary": "Experienced Python engineer specializing in APIs",
            "experience": [],
            "education": [],
            "skills": ["Python", "FastAPI", "Docker"],
            "certifications": [],
        },
        "diff": [
            {
                "section": "summary",
                "original": "Engineer",
                "tailored": "Experienced Python engineer specializing in APIs",
            }
        ],
    }
    client = MockLLMClient(mock_response)
    result = await content_rewriter.rewrite_content(
        original, {}, {}, {}, llm_client=client
    )

    assert result["content"]["summary"] == "Experienced Python engineer specializing in APIs"
    assert len(result["diff"]) == 1


@pytest.mark.asyncio
async def test_content_rewriter_invalid_json():
    original = {"contact": {"name": "John"}, "experience": []}
    client = BadLLMClient()
    result = await content_rewriter.rewrite_content(
        original, {}, {}, {}, llm_client=client
    )

    # Should return original content, not crash
    assert result["content"] == original
    assert result["diff"] == []


# --- Job Ranker Tests ---


SAMPLE_RESUME = {
    "contact": {"name": "Jane Doe", "email": "jane@example.com"},
    "summary": "Senior Python engineer with 8 years of API and distributed systems experience.",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Kubernetes", "AWS"],
    "experience": [
        {"title": "Senior Engineer", "company": "Acme", "duration": "2020-2025"},
    ],
}

SAMPLE_JOBS = [
    {
        "id": "job-1",
        "title": "Senior Backend Engineer",
        "company": "TechCo",
        "description": "Python, FastAPI, AWS. Build scalable APIs.",
        "experience_level": "senior",
    },
    {
        "id": "job-2",
        "title": "Junior Marketing Associate",
        "company": "MarketInc",
        "description": "Social media marketing, copywriting.",
        "experience_level": "entry",
    },
]


@pytest.mark.asyncio
async def test_job_ranker_valid_response():
    """Ranker returns score + reason + recommendation for each job."""
    mock_response = {
        "rankings": [
            {
                "job_id": "job-1",
                "match_score": 88,
                "match_reason": "Strong Python/API alignment",
                "recommendation": "strong",
            },
            {
                "job_id": "job-2",
                "match_score": 12,
                "match_reason": "Unrelated marketing role",
                "recommendation": "weak",
            },
        ]
    }
    client = MockLLMClient(mock_response)
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, SAMPLE_JOBS, llm_client=client)

    assert len(result) == 2
    by_id = {r["job_id"]: r for r in result}
    assert by_id["job-1"]["match_score"] == 88
    assert by_id["job-1"]["recommendation"] == "strong"
    assert by_id["job-2"]["match_score"] == 12
    assert by_id["job-2"]["recommendation"] == "weak"


@pytest.mark.asyncio
async def test_job_ranker_invalid_json_falls_back():
    """On LLM failure, returns a neutral ranking for every job (no crash)."""
    client = BadLLMClient()
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, SAMPLE_JOBS, llm_client=client)

    assert len(result) == 2
    for r in result:
        assert r["job_id"] in {"job-1", "job-2"}
        assert 0 <= r["match_score"] <= 100
        assert r["recommendation"] in {"strong", "moderate", "weak"}


@pytest.mark.asyncio
async def test_job_ranker_empty_jobs():
    """With no jobs, returns empty list without calling the LLM."""
    client = BadLLMClient()
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, [], llm_client=client)
    assert result == []


@pytest.mark.asyncio
async def test_job_ranker_clamps_score_range():
    """Scores outside 0-100 are clamped."""
    mock_response = {
        "rankings": [
            {"job_id": "job-1", "match_score": 150, "match_reason": "x", "recommendation": "strong"},
            {"job_id": "job-2", "match_score": -30, "match_reason": "y", "recommendation": "weak"},
        ]
    }
    client = MockLLMClient(mock_response)
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, SAMPLE_JOBS, llm_client=client)

    by_id = {r["job_id"]: r for r in result}
    assert by_id["job-1"]["match_score"] == 100
    assert by_id["job-2"]["match_score"] == 0


@pytest.mark.asyncio
async def test_job_ranker_missing_job_gets_default():
    """If LLM omits a job, it gets a safe default ranking."""
    mock_response = {
        "rankings": [
            {"job_id": "job-1", "match_score": 80, "match_reason": "Good fit", "recommendation": "strong"},
            # job-2 omitted
        ]
    }
    client = MockLLMClient(mock_response)
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, SAMPLE_JOBS, llm_client=client)

    by_id = {r["job_id"]: r for r in result}
    assert by_id["job-1"]["match_score"] == 80
    # job-2 must still have an entry, even if LLM omitted it
    assert "job-2" in by_id
    assert 0 <= by_id["job-2"]["match_score"] <= 100


@pytest.mark.asyncio
async def test_job_ranker_derives_recommendation_from_score():
    """If LLM sets an invalid recommendation, it's derived from score."""
    mock_response = {
        "rankings": [
            {"job_id": "job-1", "match_score": 85, "match_reason": "x", "recommendation": "nonsense"},
            {"job_id": "job-2", "match_score": 30, "match_reason": "y", "recommendation": "xyz"},
        ]
    }
    client = MockLLMClient(mock_response)
    result = await job_ranker.rank_jobs(SAMPLE_RESUME, SAMPLE_JOBS, llm_client=client)

    by_id = {r["job_id"]: r for r in result}
    assert by_id["job-1"]["recommendation"] == "strong"
    assert by_id["job-2"]["recommendation"] == "weak"


# --- Question Suggester Tests ---


SAMPLE_QUESTIONS = [
    {"name": "why_interested", "label": "Why are you interested in this role?", "field_type": "textarea", "options": []},
    {"name": "work_auth", "label": "Are you authorized to work in the US?", "field_type": "multi_value_single_select", "options": ["Yes", "No"]},
    {"name": "pronouns", "label": "Preferred pronouns?", "field_type": "input_text", "options": []},
]


@pytest.mark.asyncio
async def test_question_suggester_returns_one_entry_per_question():
    mock_response = {
        "answers": {
            "why_interested": "Your mission aligns with my experience in distributed systems.",
            "work_auth": "Yes",
            "pronouns": "she/her",
        }
    }
    client = MockLLMClient(mock_response)
    result = await question_suggester.suggest_answers(
        SAMPLE_RESUME, SAMPLE_QUESTIONS, llm_client=client
    )

    assert result["why_interested"].startswith("Your mission aligns")
    assert result["work_auth"] == "Yes"
    assert result["pronouns"] == "she/her"


@pytest.mark.asyncio
async def test_question_suggester_invalid_json_returns_empty():
    client = BadLLMClient()
    result = await question_suggester.suggest_answers(
        SAMPLE_RESUME, SAMPLE_QUESTIONS, llm_client=client
    )
    # Never raises. Empty dict means "no suggestions available".
    assert result == {}


@pytest.mark.asyncio
async def test_question_suggester_empty_questions_skips_llm():
    """With no questions, no LLM call and an empty result."""
    client = BadLLMClient()
    result = await question_suggester.suggest_answers(
        SAMPLE_RESUME, [], llm_client=client
    )
    assert result == {}


@pytest.mark.asyncio
async def test_question_suggester_filters_to_known_questions():
    """LLM answers for names we didn't ask about are dropped."""
    mock_response = {
        "answers": {
            "why_interested": "Good answer",
            "unknown_field": "Should be dropped",
        }
    }
    client = MockLLMClient(mock_response)
    result = await question_suggester.suggest_answers(
        SAMPLE_RESUME, SAMPLE_QUESTIONS, llm_client=client
    )
    assert "why_interested" in result
    assert "unknown_field" not in result


@pytest.mark.asyncio
async def test_question_suggester_constrains_select_answers_to_options():
    """For select fields, the answer must be one of the provided options; otherwise dropped."""
    mock_response = {
        "answers": {
            "work_auth": "Maybe",  # not in options ["Yes", "No"]
        }
    }
    client = MockLLMClient(mock_response)
    result = await question_suggester.suggest_answers(
        SAMPLE_RESUME, SAMPLE_QUESTIONS, llm_client=client
    )
    assert "work_auth" not in result


# --- Greenhouse form fetcher ------------------------------------------------

def _mock_httpx_response(*, status_code: int, json_data: dict | None = None):
    """Build a mock httpx.Response that supports both `.is_success` and `.json()`."""
    response = MagicMock()
    response.status_code = status_code
    response.is_success = 200 <= status_code < 300
    response.json = MagicMock(return_value=json_data or {})
    return response


@pytest.mark.asyncio
async def test_fetch_greenhouse_form_returns_questions_and_available():
    """Happy path: returns a list of questions plus api_available=True."""
    fake_response = _mock_httpx_response(
        status_code=200,
        json_data={
            "questions": [
                {
                    "label": "Why do you want to work here?",
                    "required": True,
                    "fields": [{"name": "why_us", "type": "textarea", "values": []}],
                }
            ]
        },
    )
    with patch("src.agents.auto_apply_agent.httpx.AsyncClient") as mock_client_cls:
        client_instance = mock_client_cls.return_value.__aenter__.return_value
        client_instance.get = AsyncMock(return_value=fake_response)

        result = await auto_apply_agent.fetch_greenhouse_form("techco", "12345")

    # The function must always return a 2-tuple so callers can unpack safely.
    assert isinstance(result, tuple) and len(result) == 2
    questions, api_available = result
    assert api_available is True
    assert len(questions) == 1
    assert questions[0].name == "why_us"


@pytest.mark.asyncio
async def test_fetch_greenhouse_form_returns_api_unavailable_on_404():
    """404 from Greenhouse means the company has disabled programmatic applications."""
    fake_response = _mock_httpx_response(status_code=404)
    with patch("src.agents.auto_apply_agent.httpx.AsyncClient") as mock_client_cls:
        client_instance = mock_client_cls.return_value.__aenter__.return_value
        client_instance.get = AsyncMock(return_value=fake_response)

        questions, api_available = await auto_apply_agent.fetch_greenhouse_form(
            "airbnb", "99999"
        )

    assert questions == []
    assert api_available is False


@pytest.mark.asyncio
async def test_fetch_greenhouse_form_network_error_keeps_api_available_true():
    """Transient network errors should NOT mark the API permanently unavailable."""
    with patch("src.agents.auto_apply_agent.httpx.AsyncClient") as mock_client_cls:
        client_instance = mock_client_cls.return_value.__aenter__.return_value
        client_instance.get = AsyncMock(side_effect=Exception("timeout"))

        questions, api_available = await auto_apply_agent.fetch_greenhouse_form(
            "techco", "12345"
        )

    assert questions == []
    assert api_available is True
