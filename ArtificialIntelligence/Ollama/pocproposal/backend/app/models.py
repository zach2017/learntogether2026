from sqlalchemy import Column, String, Text, DateTime, func, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .db import Base

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(String, primary_key=True)
    name = Column(String, index=True)
    email = Column(String, index=True)
    raw_text = Column(Text)
    s3_key = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(String, primary_key=True)
    kind = Column(String, index=True)  # resume|proposal|skills_gap|what_if
    subject_id = Column(String, index=True)  # resume_id or job_id, etc.
    payload = Column(JSONB)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
