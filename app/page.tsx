import Storefront from "./storefront";
import { allProducts } from "../lib/catalog";
import { parseFilters, type SearchValues } from "../lib/store-routes";
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return (
    <Storefront
      initialProducts={await allProducts()}
      initialFilters={parseFilters(await searchParams)}
    />
  );
}
