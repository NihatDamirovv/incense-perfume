import { handle, json, authorize, readJson } from "../../../lib/api";
import { listBrands, saveBrand } from "../../../lib/content";
export async function GET() {
  return handle(async () => json({ data: await listBrands() }));
}
export async function POST(req: Request) {
  return handle(async () => {
    await authorize(req);
    return json({ data: await saveBrand(await readJson(req)) }, 201);
  });
}
