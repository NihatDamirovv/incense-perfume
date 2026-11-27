import { handle, json, authorize, readJson } from "../../../lib/api";
import { readSettings, updateSettings } from "../../../lib/content";
export async function GET() {
  return handle(async () => json(await readSettings()));
}
export async function PUT(req: Request) {
  return handle(async () => {
    await authorize(req);
    return json(await updateSettings(await readJson(req)));
  });
}
