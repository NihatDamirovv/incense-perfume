import { database, json } from "../../../lib/api";
import { env } from "cloudflare:workers";
export async function GET() {
  try {
    await database().prepare("SELECT id FROM products LIMIT 1").first();
    if (!env.BUCKET) throw Error();
    return json({ status: "ok", database: "ready", storage: "configured" });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
