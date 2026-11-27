import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const config = JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
for (const db of config.d1_databases) db.migrations_dir = resolve('drizzle');
await writeFile('dist/server/wrangler.local.json', JSON.stringify(config));
const args = [
  "--import",
  "./scripts/sites-env.mjs",
  "./node_modules/wrangler/bin/wrangler.js",
  "d1",
  "migrations",
  "apply",
  "DB",
  "--local",
  "--config",
  "dist/server/wrangler.local.json",
  "--persist-to",
  ".wrangler/state",
];
const result = spawnSync(process.execPath, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
