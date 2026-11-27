import Storefront from "../storefront";
import { allProducts } from "../../lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  return (
    <Storefront
      catalogView
      pageView="brands"
      initialProducts={await allProducts()}
    />
  );
}
