import { env } from "cloudflare:workers";
import {
  handle,
  json,
  authorize,
  readBody,
  ApiError,
  database,
} from "../../../lib/api";
export async function POST(req: Request) {
  return handle(async () => {
    await authorize(req);
    if (!req.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new ApiError(
        415,
        "multipart/form-data tələb olunur.",
        "INVALID_CONTENT_TYPE",
      );
    const bytes = await readBody(req, 5 * 1024 * 1024 + 16000);
    let form: FormData;
    try {
      form = await new Request(req.url, {
        method: "POST",
        headers: { "Content-Type": req.headers.get("content-type")! },
        body: bytes,
      }).formData();
    } catch {
      throw new ApiError(
        400,
        "Fayl sorğusu düzgün deyil.",
        "INVALID_MULTIPART",
      );
    }
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      file.size < 12
    )
      throw new ApiError(
        400,
        "JPG, PNG və ya WebP seçin (maksimum 5 MB).",
        "INVALID_FILE",
      );
    const data = new Uint8Array(await file.arrayBuffer());
    const valid =
      file.type === "image/jpeg"
        ? data[0] === 255 && data[1] === 216 && data[2] === 255
        : file.type === "image/png"
          ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => data[i] === v)
          : String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...data.slice(8, 12)) === "WEBP";
    if (!valid)
      throw new ApiError(400, "Şəkil formatı etibarlı deyil.", "INVALID_FILE");
    if (!env.BUCKET)
      throw new ApiError(
        503,
        "Şəkil yaddaşı hazır deyil.",
        "STORAGE_UNAVAILABLE",
      );
    const name =
      crypto.randomUUID() +
      "." +
      { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
        file.type
      ];
    await env.BUCKET.put(name, data, {
      httpMetadata: { contentType: file.type },
    });
    await database()
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) VALUES (?,?,NULL,?)",
      )
      .bind(crypto.randomUUID(), "image.upload", Date.now())
      .run();
    return json({ url: "/api/images/" + name }, 201);
  });
}
