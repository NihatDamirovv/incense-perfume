import { samples, type Product } from "../app/data";
import { ApiError, database, productSchema } from "./api";
import { env } from "cloudflare:workers";
import {
  productOrigin,
  matchesPrice,
  seasons,
  origins,
} from "./product-options";
type Stored = Product & { deleted?: boolean };
export async function allProducts() {
  const rows = await database()
    .prepare("SELECT data FROM products")
    .all<{ data: string }>();
  return rows.results.length
    ? rows.results
        .map((r) => JSON.parse(r.data) as Stored)
        .filter((p) => !p.deleted)
    : samples;
}
export async function getProduct(id: string) {
  const p = (await allProducts()).find((p) => p.id === id);
  if (!p) throw new ApiError(404, "Parfüm tapılmadı.", "NOT_FOUND");
  return p;
}
export async function seedStatements() {
  const db = database();
  const row = await db.prepare("SELECT id FROM products LIMIT 1").first();
  return row
    ? []
    : samples.map((s) =>
        db
          .prepare("INSERT OR IGNORE INTO products(id,data) VALUES (?,?)")
          .bind(s.id, JSON.stringify(s)),
      );
}
export async function saveProduct(raw: unknown, id?: string) {
  const p = productSchema.parse(raw);
  if (id) await getProduct(id);
  if (p.image) {
    const file = await env.BUCKET?.head(p.image.replace("/api/images/", ""));
    if (!file)
      throw new ApiError(
        400,
        "Şəkil tapılmadı. Yenidən yükləyin.",
        "IMAGE_NOT_FOUND",
      );
  }
  const key = id || crypto.randomUUID();
  const data = { ...p, id: key };
  const db = database();
  await db.batch([
    ...(await seedStatements()),
    db
      .prepare(
        "INSERT INTO products(id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .bind(key, JSON.stringify(data)),
    db
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) VALUES (?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        id ? "product.update" : "product.create",
        key,
        Date.now(),
      ),
  ]);
  return data;
}
export async function deleteProduct(id: string) {
  await getProduct(id);
  const db = database();
  await db.batch([
    ...(await seedStatements()),
    db
      .prepare(
        "INSERT INTO products(id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .bind(id, JSON.stringify({ id, deleted: true })),
    db
      .prepare(
        "INSERT INTO audit_log(id,action,product_id,created_at) VALUES (?,?,?,?)",
      )
      .bind(crypto.randomUUID(), "product.delete", id, Date.now()),
  ]);
}
export async function queryProducts(url: URL) {
  const p = url.searchParams;
  const page = Number(p.get("page") || 1),
    limit = Number(p.get("limit") || 12),
    min = p.has("minPrice") ? Number(p.get("minPrice")) : 0,
    max = p.has("maxPrice") ? Number(p.get("maxPrice")) : Infinity;
  const sort = p.get("sort") || "default";
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isFinite(min) ||
    min < 0 ||
    Number.isNaN(max) ||
    max < min ||
    !["default", "price_asc", "price_desc", "name"].includes(sort)
  )
    throw new ApiError(
      400,
      "Filtr və səhifələmə parametrlərini yoxlayın.",
      "INVALID_QUERY",
    );
  if (
    (p.has("origin") &&
      !origins.includes(p.get("origin") as (typeof origins)[number])) ||
    (p.has("season") &&
      !seasons.includes(p.get("season") as (typeof seasons)[number]))
  )
    throw new ApiError(400, "Filtr düzgün deyil.", "INVALID_QUERY");
  const q = (p.get("q") || "").toLocaleLowerCase("az");
  let rows = (await allProducts()).filter(
    (x) =>
      (!p.get("brand") || x.brand === p.get("brand")) &&
      (!p.get("gender") || x.gender === p.get("gender")) &&
      `${x.name} ${x.brand} ${x.notes}`.toLocaleLowerCase("az").includes(q) &&
      matchesPrice(x, min, max) &&
      (!p.get("origin") || productOrigin(x) === p.get("origin")) &&
      (!p.get("season") || (x.seasons || []).includes(p.get("season")!)) &&
      (!p.has("available") || String(x.available) === p.get("available")),
  );
  if (sort === "price_asc") rows.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") rows.sort((a, b) => b.price - a.price);
  if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: rows.length,
      pages: Math.ceil(rows.length / limit),
    },
  };
}
