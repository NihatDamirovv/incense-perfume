import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Local tests only.");
const token = (await readFile(".dev.vars", "utf8"))
  .match(/^ADMIN_PASSWORD=(.+)$/m)[1]
  .trim();
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  "cf-connecting-ip": `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
};
const request = (path, method = "GET", body, auth = true) =>
  fetch(base + path, {
    method,
    headers: auth ? headers : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
let checks = 0;
function check(a, b, label) {
  assert.deepEqual(a, b, label);
  console.log("PASS " + label);
  checks++;
}
const stamp = Date.now(),
  name = "CMS Test " + stamp;
let brandId, productId, settingsSnapshot, restoreRevision;
try {
  const settingsResponse = await request("/api/settings");
  check(settingsResponse.status, 200, "settings readable");
  settingsSnapshot = await settingsResponse.json();
  check(
    (
      await request(
        "/api/settings",
        "PUT",
        { data: settingsSnapshot.data, revision: settingsSnapshot.revision },
        false,
      )
    ).status,
    401,
    "settings writes protected",
  );
  const body = {
    name,
    description: "Test description",
    image: "",
    featured: true,
    sortOrder: 999,
  };
  const created = await request("/api/brands", "POST", body);
  check(created.status, 201, "standalone brand created");
  brandId = (await created.json()).data.id;
  let brands = (await (await request("/api/brands")).json()).data;
  check(
    brands.find((b) => b.id === brandId)?.count,
    0,
    "brand visible with no products",
  );
  check(
    (await request("/api/brands", "POST", body)).status,
    409,
    "duplicate brand rejected",
  );
  check(
    (await request("/api/brands", "POST", { ...body, name: "Blocked" }, false))
      .status,
    401,
    "brand writes protected",
  );
  const product = {
    name: "CMS Test Parfum",
    brand: name,
    price: 123.45,
    size: 100,
    gender: "Uniseks",
    family: "Odunsu",
    notes: "Müşk",
    description: "Test",
    image: "",
    available: true,
  };
  const pr = await request("/api/products", "POST", product);
  check(pr.status, 201, "brand product created");
  productId = (await pr.json()).data.id;
  check(
    (await request("/api/brands/" + brandId, "DELETE")).status,
    409,
    "brand with products cannot be deleted",
  );
  const renamed = name + " Renamed";
  check(
    (await request("/api/brands/" + brandId, "PUT", { ...body, name: renamed }))
      .status,
    200,
    "brand renamed",
  );
  check(
    (await (await request("/api/products/" + productId)).json()).data.brand,
    renamed,
    "brand rename cascades to products",
  );
  const draft = {
    ...settingsSnapshot.data,
    whatsappNumber: "+994 50 779 00 84",
    aboutText: settingsSnapshot.data.aboutText + "\nCMS test " + stamp,
  };
  const savedResponse = await request("/api/settings", "PUT", {
    data: draft,
    revision: settingsSnapshot.revision,
  });
  check(savedResponse.status, 200, "site content saved");
  const saved = await savedResponse.json();
  restoreRevision = saved.revision;
  check(
    saved.data.whatsappNumber,
    "994507790084",
    "WhatsApp number normalized",
  );
  check(
    (await (await request("/api/settings")).json()).data.aboutText,
    draft.aboutText,
    "about text persisted",
  );
  check(
    (
      await request("/api/settings", "PUT", {
        data: draft,
        revision: settingsSnapshot.revision,
      })
    ).status,
    409,
    "concurrent stale edits rejected",
  );
  check(
    (
      await request("/api/settings", "PUT", {
        data: { ...draft, whatsappNumber: "bad" },
        revision: restoreRevision,
      })
    ).status,
    400,
    "invalid WhatsApp number rejected",
  );
  check(
    (
      await request("/api/settings", "PUT", {
        data: { ...draft, instagram: "javascript:alert(1)" },
        revision: restoreRevision,
      })
    ).status,
    400,
    "unsafe link rejected",
  );
  const orderResponse = await request(
    "/api/checkout",
    "POST",
    { items: [{ id: productId, quantity: 2 }] },
    false,
  );
  check(orderResponse.status, 200, "public checkout");
  const order = await orderResponse.json();
  check(order.total, 246.9, "checkout calculates total");
  check(
    new URL(order.url).pathname,
    "/994507790084",
    "checkout uses configured number",
  );
  const message = new URL(order.url).searchParams.get("text");
  check(
    message.includes(renamed) &&
      message.includes("× 2") &&
      message.includes("246.90"),
    true,
    "WhatsApp draft contains product quantity and total",
  );
  check(
    (
      await request(
        "/api/checkout",
        "POST",
        { items: [{ id: productId, quantity: 0 }] },
        false,
      )
    ).status,
    400,
    "zero quantity rejected",
  );
  check(
    (
      await request(
        "/api/checkout",
        "POST",
        { items: [{ id: "missing", quantity: 1 }] },
        false,
      )
    ).status,
    409,
    "missing product rejected",
  );
  await request("/api/products/" + productId, "PUT", {
    ...product,
    brand: renamed,
    available: false,
  });
  check(
    (
      await request(
        "/api/checkout",
        "POST",
        { items: [{ id: productId, quantity: 1 }] },
        false,
      )
    ).status,
    409,
    "out-of-stock checkout rejected",
  );
  check(
    (await request("/api/products/" + productId, "DELETE")).status,
    204,
    "test product removed",
  );
  productId = null;
  check(
    (await request("/api/brands/" + brandId, "DELETE")).status,
    204,
    "empty brand deleted",
  );
  brandId = null;
  console.log(`All ${checks} CMS and checkout checks passed.`);
} finally {
  if (productId) await request("/api/products/" + productId, "DELETE");
  if (brandId) await request("/api/brands/" + brandId, "DELETE");
  if (restoreRevision !== undefined) {
    const r = await request("/api/settings", "PUT", {
      data: settingsSnapshot.data,
      revision: restoreRevision,
    });
    assert.equal(
      r.status,
      200,
      "Original site settings restored without overwriting concurrent changes",
    );
    console.log("Original content restored.");
  }
}
