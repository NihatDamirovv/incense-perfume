import type { Product } from "../app/data";
export const seasons = ["Yaz", "Yay", "Payız", "Qış"] as const;
export const origins = ["Avropa", "Ərəb"] as const;
export function productOrigin(p: Pick<Product, "origin" | "brand">): string {
  if (p.origin !== undefined) return p.origin;
  return [
    "chanel",
    "creed",
    "dior",
    "maison francis kurkdjian",
    "tom ford",
    "xerjoff",
  ].includes(p.brand.toLowerCase())
    ? "Avropa"
    : "";
}
export function productOptions(p: Product) {
  return [
    { size: p.size, price: p.price, available: p.available },
    ...(p.variants || []).map((v) => ({
      ...v,
      available: p.available && v.available,
    })),
  ];
}
export function optionFor(p: Product, size?: number) {
  return productOptions(p).find((v) => v.size === (size ?? p.size));
}
export function matchesPrice(
  p: Product,
  min: string | number,
  max: string | number,
) {
  return productOptions(p).some(
    (v) =>
      v.price >= (min === "" ? 0 : Number(min)) &&
      v.price <= (max === "" ? Infinity : Number(max)),
  );
}
