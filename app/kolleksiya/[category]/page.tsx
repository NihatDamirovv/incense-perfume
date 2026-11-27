import { notFound } from "next/navigation";
import Storefront from "../../storefront";
import { allProducts } from "../../../lib/catalog";
import {
  categories,
  parseFilters,
  type SearchValues,
} from "../../../lib/store-routes";
import { readSettings } from "../../../lib/content";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchValues>;
};
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  if (!categories[category]) notFound();
  const { data: s } = await readSettings();
  return { title: `${categories[category]} parfümləri | ${s.siteName}` };
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!categories[category]) notFound();
  return (
    <Storefront
      catalogView
      initialFilters={parseFilters(await searchParams, category)}
      initialProducts={await allProducts()}
    />
  );
}
