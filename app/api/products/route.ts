import { handle, json, authorize, readJson } from "../../../lib/api";
import { queryProducts, saveProduct } from "../../../lib/catalog";
export async function GET(req: Request) {
  return handle(async () => json(await queryProducts(new URL(req.url))));
}
export async function POST(req: Request) {
  return handle(async () => {
    await authorize(req);
    const data = await saveProduct(await readJson(req));
    return json({ data }, 201, { Location: "/api/products/" + data.id });
  });
}
