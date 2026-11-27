import { notFound } from "next/navigation";
import Storefront from "../../storefront";
import { getProduct, allProducts } from "../../../lib/catalog";
import { readSettings } from "../../../lib/content";
import { ApiError } from "../../../lib/api";
import { parseFilters, type SearchValues } from "../../../lib/store-routes";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchValues>;
};
async function product(id: string) {
  try {
    return await getProduct(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
export async function generateMetadata({ params }: Props) {
  const p = await product((await params).id);
  const { data: s } = await readSettings();
  const title = `${p.brand} ${p.name} | ${s.siteName}`;
  return {
    title,
    description: p.description,
    openGraph: { title, description: p.description, type: "website" },
  };
}
export default async function ProductPage({ params, searchParams }: Props) {
  const p = await product((await params).id);
  return (
    <Storefront
      catalogView
      initialProduct={p}
      initialProducts={await allProducts()}
      initialFilters={parseFilters(await searchParams)}
    />
  );
}
