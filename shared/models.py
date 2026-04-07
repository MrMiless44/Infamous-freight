from typing import Literal

from pydantic import BaseModel, Field


class DuplicateCandidate(BaseModel):
    number: int
    title: str
    reason: str


class IssueTriageResult(BaseModel):
    summary: str
    severity: Literal["low", "medium", "high", "critical"]
    labels: list[str] = Field(default_factory=list)
    area: str
    likely_owner: str
    duplicate_of: list[DuplicateCandidate] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)


class PRReviewResult(BaseModel):
    risk_level: Literal["low", "medium", "high", "critical"]
    summary: str
    key_changes: list[str] = Field(default_factory=list)
    blocking_concerns: list[str] = Field(default_factory=list)
    non_blocking_concerns: list[str] = Field(default_factory=list)
    missing_tests: list[str] = Field(default_factory=list)
    follow_ups: list[str] = Field(default_factory=list)


class TestGapResult(BaseModel):
    coverage_risk: Literal["low", "medium", "high", "critical"]
    summary: str
    untested_areas: list[str] = Field(default_factory=list)
    recommended_test_files: list[str] = Field(default_factory=list)
    test_cases: list[str] = Field(default_factory=list)
    draft_tests: list[str] = Field(default_factory=list)


class DocsSyncCheckResult(BaseModel):
    docs_needed: bool
    summary: str
    reasons: list[str] = Field(default_factory=list)
    suggested_docs: list[str] = Field(default_factory=list)
    changelog_entry: str = ""
    migration_notes: list[str] = Field(default_factory=list)
    example_updates: list[str] = Field(default_factory=list)


class ReleasePlanResult(BaseModel):
    version_bump: Literal["major", "minor", "patch"]
    headline: str
    highlights: list[str] = Field(default_factory=list)
    breaking_changes: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)
    internal_notes: list[str] = Field(default_factory=list)
