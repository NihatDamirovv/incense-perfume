export type CatalogFilters = {
  brand: string;
  gender: string;
  query: string;
  sort: string;
  favorites: boolean;
  origin: string;
  season: string;
  min: string;
  max: string;
};
export type SearchValues = Record<string, string | string[] | undefined>;
export const defaultFilters: CatalogFilters = {
  brand: "Hamısı",
  gender: "Hamısı",
  query: "",
  sort: "selected",
  favorites: false,
  origin: "",
  season: "",
  min: "",
  max: "",
};
export const categories: Record<string, string> = {
  qadin: "Qadın",
  kisi: "Kişi",
  uniseks: "Uniseks",
};
export function parseFilters(
  search: SearchValues = {},
  category?: string,
): CatalogFilters {
  const value = (key: string) =>
    typeof search[key] === "string" ? (search[key] as string) : "";
  return {
    brand: value("brend") || "Hamısı",
    gender: categories[category || value("kateqoriya")] || "Hamısı",
    query: value("q"),
    sort: ["low", "high"].includes(value("sirala"))
      ? value("sirala")
      : "selected",
    favorites: value("secilmis") === "1",
    origin: ["Avropa", "Ərəb"].includes(value("mense")) ? value("mense") : "",
    season: ["Yaz", "Yay", "Payız", "Qış"].includes(value("fesil"))
      ? value("fesil")
      : "",
    min:
      value("min") &&
      Number.isFinite(Number(value("min"))) &&
      Number(value("min")) >= 0
        ? value("min")
        : "",
    max:
      value("max") &&
      Number.isFinite(Number(value("max"))) &&
      Number(value("max")) >= 0
        ? value("max")
        : "",
  };
}
export function catalogUrl(filters: CatalogFilters = defaultFilters) {
  const slug = Object.entries(categories).find(
    ([, name]) => name === filters.gender,
  )?.[0];
  const params = new URLSearchParams();
  if (filters.brand !== "Hamısı") params.set("brend", filters.brand);
  if (filters.query) params.set("q", filters.query);
  if (filters.sort !== "selected") params.set("sirala", filters.sort);
  if (filters.origin) params.set("mense", filters.origin);
  if (filters.season) params.set("fesil", filters.season);
  if (filters.min) params.set("min", filters.min);
  if (filters.max) params.set("max", filters.max);
  if (filters.favorites) params.set("secilmis", "1");
  return (
    "/kolleksiya" +
    (slug ? "/" + slug : "") +
    (params.size ? "?" + params.toString() : "")
  );
}
export function productUrl(
  id: string,
  filters: CatalogFilters = defaultFilters,
) {
  const catalog = new URL(catalogUrl(filters), "https://example.invalid");
  const slug = Object.entries(categories).find(
    ([, name]) => name === filters.gender,
  )?.[0];
  if (slug) catalog.searchParams.set("kateqoriya", slug);
  return "/parfum/" + encodeURIComponent(id) + catalog.search;
}
export function filtersFromUrl(url: URL) {
  return parseFilters(
    Object.fromEntries(url.searchParams),
    url.pathname.startsWith("/kolleksiya/")
      ? url.pathname.split("/")[2]
      : undefined,
  );
}
