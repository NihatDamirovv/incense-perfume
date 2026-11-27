import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("Tests only run against a local database.");
const vars = await readFile(".dev.vars", "utf8");
const token = vars.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim();
const auth = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
let checks = 0;
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
  console.log("PASS " + label);
};
const call = (path, options = {}) => fetch(base + path, options);
let created;
try {
  check(
    (await call("/api/health")).status,
    200,
    "database and storage configured",
  );
  const catalog = await (
    await call("/api/products?brand=Creed&limit=1")
  ).json();
  check(catalog.data.length, 1, "pagination limit");
  check(catalog.data[0].brand, "Creed", "brand filtering");
  check(
    (await call("/api/products?limit=999")).status,
    400,
    "invalid pagination rejected",
  );
  check(
    (await call("/api/products/missing-id")).status,
    404,
    "missing product",
  );
  check(
    (
      await call("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    401,
    "unauthenticated write rejected",
  );
  check(
    (await call("/api/auth/check", { method: "POST", headers: auth })).status,
    200,
    "admin authentication",
  );
  check(
    (
      await call("/api/products", {
        method: "POST",
        headers: auth,
        body: "{bad",
      })
    ).status,
    400,
    "malformed JSON",
  );
  check(
    (
      await call("/api/products", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ name: "invalid" }),
      })
    ).status,
    400,
    "schema validation",
  );
  check(
    (
      await call("/api/products", {
        method: "POST",
        headers: { ...auth, Origin: "https://untrusted.example" },
        body: "{}",
      })
    ).status,
    403,
    "cross-origin write rejected",
  );
  check(
    (
      await call("/api/products", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ description: "a".repeat(40000) }),
      })
    ).status,
    413,
    "oversized JSON rejected",
  );
  const invalid = new FormData();
  invalid.set(
    "file",
    new Blob(["this is not an image"], { type: "image/png" }),
    "bad.png",
  );
  check(
    (
      await call("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: invalid,
      })
    ).status,
    400,
    "forged image rejected",
  );
  const image = new FormData();
  image.set(
    "file",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "test.png",
  );
  const uploaded = await call("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: image,
  });
  check(uploaded.status, 201, "R2 upload");
  const { url } = await uploaded.json();
  const download = await call(url);
  check(download.status, 200, "uploaded image retrieval");
  check(download.headers.get("content-type"), "image/png", "image MIME type");
  const product = {
    name: "API test product",
    brand: "Test Atelier",
    price: 125,
    size: 50,
    gender: "Uniseks",
    family: "Odunsu",
    notes: "Müşk",
    description: "Integration test",
    image: url,
    available: true,
  };
  const added = await call("/api/products", {
    method: "POST",
    headers: auth,
    body: JSON.stringify(product),
  });
  check(added.status, 201, "create product");
  created = (await added.json()).data.id;
  check(
    (await (await call("/api/products/" + created)).json()).data.name,
    product.name,
    "product persisted",
  );
  const updated = await call("/api/products/" + created, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ ...product, price: 140 }),
  });
  check(updated.status, 200, "update product");
  check(
    (await (await call("/api/products/" + created)).json()).data.price,
    140,
    "updated value persisted",
  );
  const brands = await (await call("/api/brands")).json();
  check(
    brands.data.some((b) => b.name === "Test Atelier"),
    true,
    "new brand appears",
  );
  const audit = await (
    await call("/api/admin/audit", { headers: auth })
  ).json();
  check(
    audit.data.some(
      (e) => e.product_id === created && e.action === "product.create",
    ),
    true,
    "audit persisted",
  );
  check((await call("/api/admin/audit")).status, 401, "audit protected");
  check(
    (
      await call("/api/products/" + created, {
        method: "DELETE",
        headers: auth,
      })
    ).status,
    204,
    "delete product",
  );
  check(
    (await call("/api/products/" + created)).status,
    404,
    "deleted product hidden",
  );
  created = null;
  const rateIp = '192.0.2.' + (1 + Math.floor(Math.random() * 250));
  for (let i = 0; i < 12; i++) {
    const r = await call("/api/auth/check", {
      method: "POST",
      headers: { Authorization: "Bearer invalid", 'cf-connecting-ip': rateIp },
    });
    if (i === 11) check(r.status, 429, "invalid login rate limit");
  }
  console.log(`All ${checks} API checks passed.`);
} finally {
  if (created)
    await call("/api/products/" + created, { method: "DELETE", headers: auth });
}
