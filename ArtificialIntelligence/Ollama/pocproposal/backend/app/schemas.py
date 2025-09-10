from pydantic import BaseModel, Field
from typing import Optional, List, Any

class ResumeIn(BaseModel):
    id: str
    name: str
    email: str
    raw_text: str

class JobIn(BaseModel):
    id: str
    title: str
    description: str

class AnalysisResponse(BaseModel):
    id: str
    kind: str
    score: Optional[int] = None
    payload: Any

class WhatIfIn(BaseModel):
    resume_text: str
    scenario: str

class SkillsGapIn(BaseModel):
    candidate_skills: List[str] = Field(default_factory=list)
    target_skills: List[str] = Field(default_factory=list)
