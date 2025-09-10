import uuid, json, asyncio
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from .db import get_db
from .models import Resume, Job, AnalysisResult
from .schemas import ResumeIn, JobIn, AnalysisResponse, WhatIfIn, SkillsGapIn
from .ollama_client import OllamaClient
from .prompts import RESUME_ANALYSIS, PROPOSAL_ANALYSIS, SKILLS_GAP, WHAT_IF
from .s3_client import get_s3
from .settings import get_settings

router = APIRouter(prefix="/api", tags=["api"])
settings = get_settings()

@router.post("/resumes", response_model=dict)
async def add_resume(item: ResumeIn, db: AsyncSession = Depends(get_db)):
    await db.execute(insert(Resume).values(
        id=item.id, name=item.name, email=item.email, raw_text=item.raw_text
    ))
    await db.commit()
    return {"ok": True, "id": item.id}

@router.post("/jobs", response_model=dict)
async def add_job(item: JobIn, db: AsyncSession = Depends(get_db)):
    await db.execute(insert(Job).values(
        id=item.id, title=item.title, description=item.description
    ))
    await db.commit()
    return {"ok": True, "id": item.id}

@router.post("/upload-resume", response_model=dict)
async def upload_resume_file(file: UploadFile = File(...), id: str = Form(...)):
    key = f"resumes/{id}/{file.filename}"
    async with get_s3() as s3:
        await s3.upload_fileobj(file.file, settings.minio_bucket, key)
    return {"ok": True, "s3_key": key}

@router.post("/analyze/resume", response_model=AnalysisResponse)
async def analyze_resume(payload: ResumeIn, db: AsyncSession = Depends(get_db)):
    client = OllamaClient()
    prompt = RESUME_ANALYSIS(payload.raw_text)
    resp = await client.generate(prompt)
    res_id = str(uuid.uuid4())
    await db.execute(insert(AnalysisResult).values(
        id=res_id, kind="resume", subject_id=payload.id, payload=json.loads(resp)
    ))
    await db.commit()
    return AnalysisResponse(id=res_id, kind="resume", payload=json.loads(resp))

@router.post("/analyze/proposal", response_model=AnalysisResponse)
async def analyze_proposal(resume: ResumeIn, job: JobIn, db: AsyncSession = Depends(get_db)):
    client = OllamaClient()
    prompt = PROPOSAL_ANALYSIS(resume.raw_text, job.description)
    resp = await client.generate(prompt)
    data = json.loads(resp)
    res_id = str(uuid.uuid4())
    await db.execute(insert(AnalysisResult).values(
        id=res_id, kind="proposal", subject_id=resume.id, payload=data, score=data.get("match_score")
    ))
    await db.commit()
    return AnalysisResponse(id=res_id, kind="proposal", score=data.get("match_score"), payload=data)

@router.post("/analyze/skills-gap", response_model=AnalysisResponse)
async def analyze_skills_gap(body: SkillsGapIn, db: AsyncSession = Depends(get_db)):
    client = OllamaClient()
    prompt = SKILLS_GAP(body.candidate_skills, body.target_skills)
    resp = await client.generate(prompt)
    res_id = str(uuid.uuid4())
    data = json.loads(resp)
    await db.execute(insert(AnalysisResult).values(
        id=res_id, kind="skills_gap", subject_id="N/A", payload=data
    ))
    await db.commit()
    return AnalysisResponse(id=res_id, kind="skills_gap", payload=data)

@router.post("/analyze/what-if", response_model=AnalysisResponse)
async def analyze_what_if(body: WhatIfIn, db: AsyncSession = Depends(get_db)):
    client = OllamaClient()
    prompt = WHAT_IF(body.resume_text, body.scenario)
    resp = await client.generate(prompt)
    res_id = str(uuid.uuid4())
    data = json.loads(resp)
    await db.execute(insert(AnalysisResult).values(
        id=res_id, kind="what_if", subject_id="N/A", payload=data
    ))
    await db.commit()
    return AnalysisResponse(id=res_id, kind="what_if", payload=data)
