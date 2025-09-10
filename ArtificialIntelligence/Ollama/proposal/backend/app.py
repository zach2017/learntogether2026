from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import os
import asyncio
from datetime import datetime
import json

from services.ollama_service import OllamaService
from services.document_processor import DocumentProcessor
from services.resume_analyzer import ResumeAnalyzer
from services.proposal_analyzer import ProposalAnalyzer
from services.skills_gap_analyzer import SkillsGapAnalyzer
from models.schemas import (
    ResumeAnalysisResult,
    ProposalAnalysisResult,
    SkillsGapResult,
    WhatIfScenario,
    JobDescription
)
from config import settings
from utils.text_extractor import TextExtractor

app = FastAPI(title="Recruitment Analyzer POC", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ollama_service = OllamaService(settings.OLLAMA_URL)
doc_processor = DocumentProcessor()
resume_analyzer = ResumeAnalyzer(ollama_service)
proposal_analyzer = ProposalAnalyzer(ollama_service)
skills_gap_analyzer = SkillsGapAnalyzer(ollama_service)
text_extractor = TextExtractor()

@app.on_event("startup")
async def startup_event():
    """Initialize Ollama models on startup"""
    print("Initializing Ollama models...")
    await ollama_service.initialize_models()
    print("Models initialized successfully!")

@app.get("/")
async def root():
    return {"message": "Recruitment Analyzer POC API", "status": "running"}

@app.post("/api/analyze/resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = None
):
    """Analyze a resume and extract key information"""
    try:
        # Extract text from uploaded file
        content = await file.read()
        text = await text_extractor.extract(content, file.filename)
        
        # Analyze resume
        result = await resume_analyzer.analyze(text, job_description)
        
        return JSONResponse(content=result.dict())
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/proposal")
async def analyze_proposal(
    file: UploadFile = File(...),
    requirements: Optional[str] = None
):
    """Analyze a proposal document"""
    try:
        content = await file.read()
        text = await text_extractor.extract(content, file.filename)
        
        result = await proposal_analyzer.analyze(text, requirements)
        
        return JSONResponse(content=result.dict())
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/skills-gap")
async def analyze_skills_gap(
    current_skills: List[Dict[str, Any]],
    required_skills: List[Dict[str, Any]],
    team_size: Optional[int] = 1
):
    """Analyze skills gap between current and required skills"""
    try:
        result = await skills_gap_analyzer.analyze(
            current_skills,
            required_skills,
            team_size
        )
        
        return JSONResponse(content=result.dict())
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/what-if/scenario")
async def run_what_if_scenario(scenario: WhatIfScenario):
    """Run what-if scenarios for team planning"""
    try:
        result = await skills_gap_analyzer.run_scenario(scenario)
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch/analyze")
async def batch_analyze(
    files: List[UploadFile] = File(...),
    analysis_type: str = "resume",
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Batch process multiple documents"""
    try:
        job_id = f"batch_{datetime.now().timestamp()}"
        
        # Start background processing
        background_tasks.add_task(
            process_batch,
            files,
            analysis_type,
            job_id
        )
        
        return {
            "job_id": job_id,
            "status": "processing",
            "message": f"Processing {len(files)} files"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_batch(files, analysis_type, job_id):
    """Background task for batch processing"""
    results = []
    for file in files:
        content = await file.read()
        text = await text_extractor.extract(content, file.filename)
        
        if analysis_type == "resume":
            result = await resume_analyzer.analyze(text)
        elif analysis_type == "proposal":
            result = await proposal_analyzer.analyze(text)
        else:
            continue
            
        results.append(result)
    
    # Store results in Redis or database
    # Implementation depends on your storage choice
    return results

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    ollama_status = await ollama_service.check_health()
    
    return {
        "status": "healthy",
        "services": {
            "ollama": ollama_status,
            "database": "connected",
            "cache": "connected"
        }
    }