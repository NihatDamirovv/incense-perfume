import Storefront from "../storefront";
import { allProducts } from "../../lib/catalog";
import { parseFilters, type SearchValues } from "../../lib/store-routes";
export const dynamic = "force-dynamic";
export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return (
    <Storefront
      catalogView
      initialFilters={parseFilters(await searchParams)}
      initialProducts={await allProducts()}
    />
  );
}
