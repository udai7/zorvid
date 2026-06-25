import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

// Apply every .sql file in ./migrations in filename order, exactly once.
// Applied files are recorded in _migrations so re-runs are no-ops.
const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await pool.query<{ name: string }>("SELECT name FROM _migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`apply  ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("migrations complete");
  await pool.end();
}

main().catch((err) => {
  console.error("migration failed:", err);
  process.exit(1);
});
