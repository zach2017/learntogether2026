from typing import Dict, Any, Optional, List
import json
import re
from datetime import datetime
from models.schemas import ResumeAnalysisResult

class ResumeAnalyzer:
    def __init__(self, ollama_service):
        self.ollama = ollama_service
        self.skill_categories = {
            "programming": ["python", "java", "javascript", "c++", "c#", "ruby", "go", "rust"],
            "databases": ["mysql", "postgresql", "mongodb", "redis", "oracle", "sql server"],
            "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform"],
            "frameworks": ["react", "angular", "vue", "django", "flask", "spring", "node.js"],
            "tools": ["git", "jenkins", "jira", "confluence", "slack", "docker", "kubernetes"]
        }
    
    async def analyze(
        self,
        resume_text: str,
        job_description: Optional[str] = None
    ) -> ResumeAnalysisResult:
        """Analyze resume and extract structured information"""
        
        # Use Ollama to extract information
        analysis = await self.ollama.analyze_with_prompt(
            text=resume_text,
            analysis_type="resume"
        )
        
        # Extract skills using pattern matching and NLP
        skills = self.extract_skills(resume_text)
        
        # Calculate experience level
        experience_level = self.calculate_experience_level(resume_text)
        
        # If job description provided, calculate match score
        match_score = 0
        matched_skills = []
        missing_skills = []
        
        if job_description:
            job_skills = self.extract_skills(job_description)
            matched_skills = list(set(skills) & set(job_skills))
            missing_skills = list(set(job_skills) - set(skills))
            match_score = len(matched_skills) / len(job_skills) * 100 if job_skills else 0
        
        # Structure the result
        result = ResumeAnalysisResult(
            candidate_name=self.extract_name(resume_text),
            email=self.extract_email(resume_text),
            phone=self.extract_phone(resume_text),
            skills=skills,
            experience_years=self.extract_years_of_experience(resume_text),
            education=analysis.get("education", []),
            certifications=analysis.get("certifications", []),
            experience_level=experience_level,
            match_score=match_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            summary=self.generate_summary(analysis),
            raw_analysis=analysis
        )
        
        return result
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        for category, skills in self.skill_categories.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills.append(skill)
        
        # Also look for common skill patterns
        skill_patterns = [
            r'\b(?:proficient|experienced|skilled|expert) in ([^,\.\n]+)',
            r'skills?:?\s*([^\n]+)',
            r'technologies?:?\s*([^\n]+)'
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                # Clean and split the matched skills
                skills = [s.strip() for s in match.split(',')]
                found_skills.extend(skills)
        
        return list(set(found_skills))
    
    def extract_name(self, text: str) -> str:
        """Extract candidate name from resume"""
        lines = text.split('\n')
        for line in lines[:5]:  # Usually name is in first few lines
            if line.strip() and not any(char in line for char in ['@', 'http', 'www']):
                # Simple heuristic: first non-empty line without special characters
                return line.strip()
        return "Unknown"
    
    def extract_email(self, text: str) -> str:
        """Extract email from resume"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""
    
    def extract_phone(self, text: str) -> str:
        """Extract phone number from resume"""
        phone_pattern = r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else ""
    
    def extract_years_of_experience(self, text: str) -> int:
        """Extract years of experience from resume"""
        # Look for patterns like "X years of experience"
        pattern = r'(\d+)\+?\s*years?\s*(?:of\s*)?experience'
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
        
        # Try to calculate from work history dates
        year_pattern = r'(19|20)\d{2}'
        years = re.findall(year_pattern, text)
        if years:
            years = [int(y) for y in years]
            return max(years) - min(years)
        
        return 0
    
    def calculate_experience_level(self, text: str) -> str:
        """Calculate experience level based on years and keywords"""
        years = self.extract_years_of_experience(text)
        
        if years >= 10 or any(word in text.lower() for word in ['senior', 'lead', 'principal', 'director']):
            return "senior"
        elif years >= 3 or any(word in text.lower() for word in ['mid-level', 'intermediate']):
            return "mid"
        else:
            return "junior"
    
    def generate_summary(self, analysis: Dict[str, Any]) -> str:
        """Generate a summary of the resume analysis"""
        summary_parts = []
        
        if analysis.get("skills"):
            summary_parts.append(f"Key skills: {', '.join(analysis['skills'][:5])}")
        
        if analysis.get("experience"):
            summary_parts.append(f"Experience in {len(analysis['experience'])} roles")
        
        if analysis.get("education"):
            summary_parts.append(f"Education: {analysis['education'][0] if isinstance(analysis['education'], list) else analysis['education']}")
        
        return ". ".join(summary_parts) if summary_parts else "Resume analyzed successfully"