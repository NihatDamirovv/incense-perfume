import { handle, json, authorize, readJson, ApiError } from "../../../lib/api";
import { allProducts, saveProduct, deleteProduct } from "../../../lib/catalog";
export async function GET() {
  return handle(async () => json(await allProducts()));
}
export async function POST(req: Request) {
  return handle(async () => {
    await authorize(req);
    if (req.headers.get("x-check-auth")) return json({ ok: true });
    const body = await readJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError(400, "Məhsul obyekti tələb olunur.", "INVALID_BODY");
    const product = await saveProduct(body, body.id || undefined);
    return json({ ok: true, id: product.id });
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    await authorize(req);
    const body = await readJson(req);
    if (typeof body?.id !== "string")
      throw new ApiError(400, "Məhsul ID-si tələb olunur.", "INVALID_ID");
    await deleteProduct(body.id);
    return json({ ok: true });
  });
}
