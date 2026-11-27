import { handle, json, authorize, database } from "../../../../lib/api";
export async function GET(req: Request) {
  return handle(async () => {
    await authorize(req);
    return json({
      data: (
        await database()
          .prepare(
            "SELECT id,action,product_id,created_at FROM audit_log ORDER BY created_at DESC LIMIT 100",
          )
          .all()
      ).results,
    });
  });
}
