import { useEffect, useState } from "react";

export default function App() {
  const [msg, setMsg] = useState("Loading...");
  useEffect(() => {
    fetch("/api/hello")
      .then(r => r.json())
      .then(d => setMsg(d.message))
      .catch(() => setMsg("API not reachable yet…"));
  }, []);
  return (
    <main style={{fontFamily:"system-ui", padding:24}}>
      <h1>Argo CD Intro: React + API + Postgres</h1>
      <p><strong>API says:</strong> {msg}</p>
      <p>Push to <code>main</code> to trigger CI → build/push images → update tags → Argo CD syncs.</p>
    </main>
  );
}
