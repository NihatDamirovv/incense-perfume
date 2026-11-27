import { handle, json, authorize, readJson } from "../../../../lib/api";
import {
  getProduct,
  saveProduct,
  deleteProduct,
} from "../../../../lib/catalog";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Context) {
  return handle(async () =>
    json({ data: await getProduct((await params).id) }),
  );
}
export async function PUT(req: Request, { params }: Context) {
  return handle(async () => {
    await authorize(req);
    return json({
      data: await saveProduct(await readJson(req), (await params).id),
    });
  });
}
export async function DELETE(req: Request, { params }: Context) {
  return handle(async () => {
    await authorize(req);
    await deleteProduct((await params).id);
    return new Response(null, { status: 204 });
  });
}
