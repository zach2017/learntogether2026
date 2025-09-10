RESUME_ANALYSIS = lambda resume_text: f'''
You are an expert technical recruiter. Analyze the following resume.
Return JSON with keys: "summary", "core_skills", "years_experience_estimate", "strengths", "risks".
Resume:
"""
{resume_text}
"""
JSON ONLY:
'''

PROPOSAL_ANALYSIS = lambda resume_text, job_text: f'''
Match the resume to the job/proposal description.
Return JSON with keys: "fit_summary", "match_score" (0-100), "matched_skills", "missing_skills".
Resume:
"""
{resume_text}
"""
Job:
"""
{job_text}
"""
JSON ONLY:
'''

SKILLS_GAP = lambda candidate_skills, target_skills: f'''
Compare candidate skills vs target role requirements.
Return JSON with keys: "gaps", "upskilling_plan" (list of recommended steps/resources).
Candidate skills: {candidate_skills}
Target skills: {target_skills}
JSON ONLY:
'''

WHAT_IF = lambda resume_text, scenario: f'''
Given the resume and a hypothetical scenario, estimate impact on match score and opportunities.
Return JSON with keys: "scenario", "impact_summary", "new_opportunities", "estimated_match_score_change".
Resume:
"""
{resume_text}
"""
Scenario: {scenario}
JSON ONLY:
'''
