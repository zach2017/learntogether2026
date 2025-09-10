import React, { useState } from 'react'

const api = (path) => (import.meta.env.VITE_API_BASE || '/api') + path

export default function App() {
  const [resumeText, setResumeText] = useState('')
  const [jobText, setJobText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyzeResume = async () => {
    setLoading(true)
    const res = await fetch(api('/analyze/resume'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'ui-resume', name: 'UI User', email: 'ui@example.com', raw_text: resumeText })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  const analyzeProposal = async () => {
    setLoading(true)
    const res = await fetch(api('/analyze/proposal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: { id: 'ui-resume', name: 'UI User', email: 'ui@example.com', raw_text: resumeText },
        job: { id: 'ui-job', title: 'Example', description: jobText }
      })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  const analyzeSkillsGap = async () => {
    setLoading(true)
    const res = await fetch(api('/analyze/skills-gap'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_skills: resumeText.split(',').map(s => s.trim()).filter(Boolean),
        target_skills: jobText.split(',').map(s => s.trim()).filter(Boolean)
      })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  const whatIf = async () => {
    setLoading(true)
    const res = await fetch(api('/analyze/what-if'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText, scenario: jobText })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recruitment Analysis POC</h1>
          <a href="/api/docs" className="underline text-sm">API Docs</a>
        </header>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Resume Text</h2>
            <textarea className="w-full h-48 border rounded p-2" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste resume or skills (comma-separated for Skills Gap)"/>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Job / Scenario / Target Skills</h2>
            <textarea className="w-full h-48 border rounded p-2" value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Paste job description, list target skills, or type a what-if scenario"/>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={analyzeResume} className="px-4 py-2 bg-black text-white rounded-xl">{loading ? 'Running…' : 'Resume Analysis'}</button>
          <button onClick={analyzeProposal} className="px-4 py-2 bg-blue-600 text-white rounded-xl">{loading ? 'Running…' : 'Proposal Analysis'}</button>
          <button onClick={analyzeSkillsGap} className="px-4 py-2 bg-emerald-600 text-white rounded-xl">{loading ? 'Running…' : 'Skills Gap'}</button>
          <button onClick={whatIf} className="px-4 py-2 bg-purple-600 text-white rounded-xl">{loading ? 'Running…' : 'What-If'}</button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Result</h2>
          <pre className="text-sm whitespace-pre-wrap">{result ? JSON.stringify(result, null, 2) : 'No result yet.'}</pre>
        </div>
      </div>
    </div>
  )
}
