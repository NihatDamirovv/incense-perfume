import { env } from "cloudflare:workers";
import { z } from "zod";
import {
  defaultSettings,
  type SiteSettings,
  type Brand,
} from "../app/site-content";
import { ApiError, database } from "./api";
import { allProducts, seedStatements } from "./catalog";
export const imageSchema = z
  .string()
  .regex(/^$|^\/api\/images\/[a-f0-9-]+\.(jpg|png|webp)$/);
const shape = Object.fromEntries(
  Object.entries(defaultSettings).map(([k, v]) => [
    k,
    typeof v === "boolean" ? z.boolean() : z.string().trim().max(5000),
  ]),
);
export const settingsSchema = z
  .object({
    ...shape,
    siteName: z.string().trim().max(80),
    whatsappNumber: z
      .string()
      .transform((s) => s.replace(/[+\s()-]/g, ""))
      .pipe(z.string().regex(/^[1-9][0-9]{7,14}$/)),
    logoImage: imageSchema,
    faviconImage: imageSchema,
    heroImage: imageSchema,
    aboutImage: imageSchema,
    email: z.string().email().or(z.literal("")),
    instagram: z
      .string()
      .url()
      .refine((s) => s.startsWith("https://"), "HTTPS linki yazın")
      .or(z.literal("")),
  })
  .strict();
export const brandSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .refine((s) => s !== "Hamısı", "Bu ad rezerv olunub"),
    description: z.string().trim().max(2000),
    image: imageSchema,
    featured: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .strict();
export function nameKey(name: string) {
  return name.normalize("NFKC").trim().toLocaleLowerCase("az");
}
export async function verifyImage(path: string) {
  if (path && !(await env.BUCKET?.head(path.replace("/api/images/", ""))))
    throw new ApiError(
      400,
      "Şəkil tapılmadı. Yenidən yükləyin.",
      "IMAGE_NOT_FOUND",
    );
}
export async function readSettings() {
  const row = await database()
    .prepare("SELECT data,revision FROM site_settings WHERE key='main'")
    .first<{ data: string; revision: number }>();
  return {
    data: {
      ...defaultSettings,
      ...(row ? JSON.parse(row.data) : {}),
    } as SiteSettings,
    revision: row?.revision || 0,
  };
}
export async function updateSettings(raw: unknown) {
  const input = z
    .object({ data: settingsSchema, revision: z.number().int().min(0) })
    .strict()
    .parse(raw);
  const data = input.data as SiteSettings;
  await Promise.all(
    [data.logoImage, data.heroImage, data.aboutImage, data.faviconImage].map(
      verifyImage,
    ),
  );
  const db = database();
  await db
    .prepare(
      "INSERT OR IGNORE INTO site_settings(key,data,revision) VALUES ('main',?,0)",
    )
    .bind(JSON.stringify(defaultSettings))
    .run();
  const results = await db.batch([
    db
      .prepare(
        "UPDATE site_settings SET data=?,revision=revision+1 WHERE key='main' AND revision=? RETURNING revision",
      )
      .bind(JSON.stringify(data), input.revision),
    db
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) SELECT ?,'settings.update',NULL,? WHERE changes() > 0",
      )
      .bind(crypto.randomUUID(), Date.now()),
  ]);
  if (!results[0].results.length)
    throw new ApiError(
      409,
      "Məzmun başqa pəncərədə dəyişib. Yenidən yükləyib cəhd edin.",
      "REVISION_CONFLICT",
    );
  return { data, revision: input.revision + 1 };
}
async function legacyId(name: string) {
  const hash = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(nameKey(name)),
    ),
  );
  return (
    "brand-" +
    Array.from(hash.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
export async function listBrands(): Promise<Brand[]> {
  const [rows, products] = await Promise.all([
    database().prepare("SELECT data FROM brands").all<{ data: string }>(),
    allProducts(),
  ]);
  const merged = new Map<string, Brand>();
  for (const p of products) {
    const key = nameKey(p.brand);
    if (!merged.has(key))
      merged.set(key, {
        id: await legacyId(p.brand),
        name: p.brand,
        description: "",
        image: "",
        featured: true,
        sortOrder: 0,
        count: 0,
      });
  }
  for (const row of rows.results) {
    const b = JSON.parse(row.data) as Brand;
    merged.set(nameKey(b.name), b);
  }
  return [...merged.values()]
    .map((b) => ({
      ...b,
      count: products.filter((p) => nameKey(p.brand) === nameKey(b.name))
        .length,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
export async function saveBrand(raw: unknown, id?: string) {
  const data = brandSchema.parse(raw);
  await verifyImage(data.image);
  const brands = await listBrands(),
    old = id ? brands.find((b) => b.id === id) : undefined;
  if (id && !old) throw new ApiError(404, "Brend tapılmadı.", "NOT_FOUND");
  if (brands.some((b) => nameKey(b.name) === nameKey(data.name) && b.id !== id))
    throw new ApiError(409, "Bu adda brend artıq var.", "DUPLICATE_BRAND");
  const key = id || crypto.randomUUID();
  const brand = { ...data, id: key };
  const db = database();
  const statements = old ? [...(await seedStatements())] : [];
  statements.push(
    db
      .prepare(
        "INSERT INTO brands(id,name_key,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET name_key=excluded.name_key,data=excluded.data",
      )
      .bind(key, nameKey(data.name), JSON.stringify(brand)),
  );
  if (old) {
    const products = (await allProducts()).filter(
      (p) => nameKey(p.brand) === nameKey(old.name),
    );
    for (const p of products)
      statements.push(
        db
          .prepare(
            "UPDATE products SET data=json_set(data,'$.brand',?) WHERE id=?",
          )
          .bind(data.name, p.id),
      );
  }
  statements.push(
    db
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) VALUES (?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        old ? "brand.update" : "brand.create",
        key,
        Date.now(),
      ),
  );
  try {
    await db.batch(statements);
  } catch (e) {
    if (String(e).includes("UNIQUE"))
      throw new ApiError(409, "Bu adda brend artıq var.", "DUPLICATE_BRAND");
    throw e;
  }
  return { ...brand, count: old?.count || 0 };
}
export async function removeBrand(id: string) {
  const brand = (await listBrands()).find((b) => b.id === id);
  if (!brand) throw new ApiError(404, "Brend tapılmadı.", "NOT_FOUND");
  if (brand.count)
    throw new ApiError(
      409,
      "Əvvəl bu brendin məhsullarını başqa brendə keçirin və ya silin.",
      "BRAND_HAS_PRODUCTS",
    );
  const db = database();
  await db.batch([
    db.prepare("DELETE FROM brands WHERE id=?").bind(id),
    db
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) VALUES (?,?,?,?)",
      )
      .bind(crypto.randomUUID(), "brand.delete", id, Date.now()),
  ]);
}
