import assert from "node:assert/strict";
import {
  catalogUrl,
  productUrl,
  parseFilters,
  filtersFromUrl,
  defaultFilters,
} from "../lib/store-routes.ts";
let count = 0;
function check(a, b, label) {
  assert.deepEqual(a, b, label);
  count++;
  console.log("PASS " + label);
}
check(catalogUrl(), "/kolleksiya", "all products URL");
check(
  catalogUrl({ ...defaultFilters, gender: "Qadın" }),
  "/kolleksiya/qadin",
  "women URL",
);
check(
  catalogUrl({ ...defaultFilters, gender: "Kişi" }),
  "/kolleksiya/kisi",
  "men URL",
);
check(
  catalogUrl({ ...defaultFilters, gender: "Uniseks" }),
  "/kolleksiya/uniseks",
  "unisex URL",
);
const combined = {
  ...defaultFilters,
  brand: "Maison Francis Kurkdjian",
  gender: "Qadın",
  query: "gül & müşk",
  sort: "low",
  favorites: true,
};
check(
  filtersFromUrl(new URL(catalogUrl(combined), "http://localhost")),
  combined,
  "combined filters round trip",
);
check(
  filtersFromUrl(new URL(productUrl("demo-4", combined), "http://localhost")),
  combined,
  "product URL preserves catalog context",
);
check(productUrl("demo-4"), "/parfum/demo-4", "stable product route");
check(
  parseFilters({ sirala: "invalid" }).sort,
  "selected",
  "invalid sort normalization",
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const r = await fetch(base + "/parfum/demo-4");
check(r.status, 200, "product route directly available");
const html = await r.text();
check(html.includes("Sauvage"), true, "product rendered on direct request");
check(/<title>[^<]*Sauvage/.test(html), true, "product page title");
check(
  (await fetch(base + "/parfum/route-test-missing-id")).status,
  404,
  "missing product returns 404",
);
check(
  (await fetch(base + "/kolleksiya/not-a-category")).status,
  404,
  "missing category returns 404",
);
for (const path of [
  "/kolleksiya",
  "/kolleksiya/qadin",
  "/kolleksiya/kisi?brend=Dior",
  "/kolleksiya/uniseks?q=Creed&sirala=high",
])
  check((await fetch(base + path)).status, 200, "direct catalog route " + path);
console.log(`All ${count} route checks passed.`);
