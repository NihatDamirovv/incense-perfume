import assert from "node:assert/strict";
import {
  productOptions,
  optionFor,
  productOrigin,
  matchesPrice,
} from "../lib/product-options.ts";
import {
  defaultFilters,
  catalogUrl,
  filtersFromUrl,
  productUrl,
} from "../lib/store-routes.ts";
const p = {
  id: "test",
  brand: "Creed",
  size: 100,
  price: 250,
  available: true,
  variants: [
    { size: 30, price: 90, available: true },
    { size: 50, price: 140, available: false },
  ],
};
assert.equal(productOrigin(p), "Avropa");
assert.equal(productOrigin({ ...p, origin: "Ərəb" }), "Ərəb");
assert.equal(productOrigin({ ...p, brand: "Unclassified" }), "");
assert.equal(optionFor(p, 30).price, 90);
assert.equal(optionFor(p, 50).available, false);
assert.equal(optionFor(p, 75), undefined);
assert.equal(optionFor(p).size, 100);
assert.equal(
  productOptions({ ...p, available: false }).every((v) => !v.available),
  true,
);
assert.equal(matchesPrice(p, "80", "100"), true);
assert.equal(matchesPrice(p, "300", "400"), false);
const filters = {
  ...defaultFilters,
  origin: "Ərəb",
  season: "Qış",
  min: "20",
  max: "180",
  brand: "Brand & Name",
  gender: "Qadın",
  sort: "high",
};
assert.deepEqual(
  filtersFromUrl(new URL(catalogUrl(filters), "http://localhost")),
  filters,
);
assert.deepEqual(
  filtersFromUrl(new URL(productUrl("test", filters), "http://localhost")),
  filters,
);
assert.equal(
  filtersFromUrl(new URL("http://localhost/kolleksiya?min=NaN&max=-4")).min,
  "",
);
console.log("PASS 13 product option and filter checks");
