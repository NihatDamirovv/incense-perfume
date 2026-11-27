import { handle, json, authorize } from "../../../../lib/api";
export async function POST(req: Request) {
  return handle(async () => {
    await authorize(req);
    return json({ ok: true });
  });
}
