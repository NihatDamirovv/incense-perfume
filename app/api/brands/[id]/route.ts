import { handle, json, authorize, readJson } from "../../../../lib/api";
import { saveBrand, removeBrand } from "../../../../lib/content";
type Context = { params: Promise<{ id: string }> };
export async function PUT(req: Request, { params }: Context) {
  return handle(async () => {
    await authorize(req);
    return json({
      data: await saveBrand(await readJson(req), (await params).id),
    });
  });
}
export async function DELETE(req: Request, { params }: Context) {
  return handle(async () => {
    await authorize(req);
    await removeBrand((await params).id);
    return new Response(null, { status: 204 });
  });
}
