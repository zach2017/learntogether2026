import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  host: process.env.PGHOST || "postgres",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "appdb",
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hello_log (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
init().catch(err => {
  console.error("DB init failed", err);
  process.exit(1);
});

app.get("/api/hello", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() as now");
    res.json({ message: `Hello from Postgres @ ${rows[0].now.toISOString()}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
