import { env } from "cloudflare:workers";
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}
export const productSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,64}$/)
      .or(z.literal(""))
      .optional(),
    name: z.string().trim().min(1).max(150),
    brand: z.string().trim().min(1).max(150),
    price: z.number().finite().min(0).max(1000000),
    size: z.number().int().min(1).max(10000),
    gender: z.enum(["Kişi", "Qadın", "Uniseks"]),
    family: z.string().trim().max(100),
    notes: z.string().trim().max(500),
    description: z.string().trim().max(5000),
    image: z.string().regex(/^$|^\/api\/images\/[a-f0-9-]+\.(jpg|png|webp)$/),
    available: z.boolean(),
    origin: z.enum(["", "Avropa", "Ərəb"]).optional(),
    seasons: z
      .array(z.enum(["Yaz", "Yay", "Payız", "Qış"]))
      .max(4)
      .refine(
        (v) => new Set(v).size === v.length,
        "Fəsillər təkrarlanmamalıdır",
      )
      .default([]),
    variants: z
      .array(
        z
          .object({
            size: z.number().int().min(1).max(10000),
            price: z.number().finite().min(0).max(1000000),
            available: z.boolean(),
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict()
  .refine(
    (p) =>
      new Set([p.size, ...p.variants.map((v) => v.size)]).size ===
      p.variants.length + 1,
    "Həcm təkrarlanmamalıdır",
  );
export function json(
  data: unknown,
  status = 200,
  extra: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
export function database() {
  if (!env.DB)
    throw new ApiError(
      503,
      "Məlumat bazası hazır deyil.",
      "DATABASE_UNAVAILABLE",
    );
  return env.DB;
}
export async function handle(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (e) {
    if (e instanceof z.ZodError)
      return json(
        {
          error: "Göndərilən məlumatlar düzgün deyil.",
          code: "VALIDATION_ERROR",
          fields: e.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        400,
      );
    if (e instanceof ApiError)
      return json(
        { error: e.message, code: e.code },
        e.status,
        e.status === 429 ? { "Retry-After": "900" } : {},
      );
    console.error(
      "API operation failed",
      e instanceof Error ? e.name : "UnknownError",
    );
    return json(
      {
        error: "Sorğu yerinə yetirilmədi. Yenidən cəhd edin.",
        code: "INTERNAL_ERROR",
      },
      500,
    );
  }
}
export async function readBody(req: Request, max = 32000) {
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new ApiError(
      413,
      "Göndərilən fayl və ya məlumat həddən böyükdür.",
      "BODY_TOO_LARGE",
    );
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw new ApiError(
        413,
        "Göndərilən fayl və ya məlumat həddən böyükdür.",
        "BODY_TOO_LARGE",
      );
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export async function readJson(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(
      415,
      "Content-Type application/json olmalıdır.",
      "INVALID_CONTENT_TYPE",
    );
  try {
    return JSON.parse(new TextDecoder().decode(await readBody(req)));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "JSON formatı düzgün deyil.", "INVALID_JSON");
  }
}
async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}
export async function authorize(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new ApiError(
      403,
      "Bu mənbədən sorğu qəbul edilmir.",
      "ORIGIN_REJECTED",
    );
  const secret = (env as unknown as Record<string, string>).ADMIN_PASSWORD;
  if (!secret)
    throw new ApiError(
      503,
      "Admin girişi konfiqurasiya edilməyib.",
      "AUTH_NOT_CONFIGURED",
    );
  const supplied =
    req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const [a, b] = await Promise.all([digest(secret), digest(supplied)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  const now = Math.floor(Date.now() / 1000);
  const ip = req.headers.get("cf-connecting-ip") || "local";
  const ipHash = Array.from(await digest(ip))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const window = Math.floor(now / 900);
  const key = `auth:${ipHash}:${window}`;
  const db = database();
  await db.prepare("DELETE FROM rate_limits WHERE expires < ?").bind(now).run();
  const locked = await db
    .prepare("SELECT count FROM rate_limits WHERE key = ?")
    .bind(key)
    .first<{ count: number }>();
  if ((locked?.count || 0) >= 10)
    throw new ApiError(
      429,
      "Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən sınayın.",
      "RATE_LIMITED",
    );
  if (diff !== 0) {
    const row = await db
      .prepare(
        "INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
      )
      .bind(key, now + 900)
      .first<{ count: number }>();
    if ((row?.count || 0) > 10)
      throw new ApiError(
        429,
        "Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən sınayın.",
        "RATE_LIMITED",
      );
    throw new ApiError(401, "Şifrə yanlışdır.", "UNAUTHORIZED");
  }
  const writeKey = `write:${ipHash}:${Math.floor(now / 60)}`;
  const row = await db
    .prepare(
      "INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .bind(writeKey, now + 60)
    .first<{ count: number }>();
  if ((row?.count || 0) > 60)
    throw new ApiError(
      429,
      "Sorğu limiti aşıldı. Bir qədər sonra yenidən cəhd edin.",
      "RATE_LIMITED",
    );
}
