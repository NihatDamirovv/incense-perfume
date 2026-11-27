import { optionFor } from "../../../lib/product-options";
import { z } from "zod";
import { handle, json, readJson, ApiError } from "../../../lib/api";
import { allProducts } from "../../../lib/catalog";
import { readSettings } from "../../../lib/content";
export async function POST(req: Request) {
  return handle(async () => {
    const { items } = z
      .object({
        items: z
          .array(
            z
              .object({
                id: z.string().min(1).max(64),
                quantity: z.number().int().min(1).max(99),
                size: z.number().int().min(1).max(10000).optional(),
              })
              .strict(),
          )
          .min(1)
          .max(30),
      })
      .strict()
      .parse(await readJson(req));
    const [products, settings] = await Promise.all([
      allProducts(),
      readSettings(),
    ]);
    const quantities = new Map<
      string,
      { id: string; size?: number; quantity: number }
    >();
    for (const item of items) {
      const selectedSize =
        item.size ?? products.find((p) => p.id === item.id)?.size;
      const key = `${item.id}:${selectedSize}`;
      const quantity = (quantities.get(key)?.quantity || 0) + item.quantity;
      if (quantity > 99)
        throw new ApiError(
          400,
          "Bir məhsul üçün maksimum say 99-dur.",
          "INVALID_QUANTITY",
        );
      quantities.set(key, { ...item, size: selectedSize, quantity });
    }
    let totalCents = 0;
    const lines = [];
    for (const { id, size, quantity } of quantities.values()) {
      const p = products.find((p) => p.id === id);
      if (!p || !p.available)
        throw new ApiError(
          409,
          "Səbətdəki məhsullardan biri artıq mövcud deyil. Kataloqu yeniləyin.",
          "PRODUCT_UNAVAILABLE",
        );
      const option = optionFor(p, size);
      if (!option || !option.available)
        throw new ApiError(
          409,
          "Seçilən həcm mövcud deyil.",
          "VARIANT_UNAVAILABLE",
        );
      const cents = Math.round(option.price * 100) * quantity;
      totalCents += cents;
      lines.push(
        `${p.brand} — ${p.name} (${option.size} ml) × ${quantity}: ${(cents / 100).toFixed(2)} ₼`,
      );
    }
    const { data: s } = settings;
    const message = [
      s.orderIntro,
      s.siteName,
      "",
      ...lines,
      "",
      `Yekun: ${(totalCents / 100).toFixed(2)} ₼`,
    ].join("\n");
    return json({
      url: `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(message)}`,
      total: totalCents / 100,
    });
  });
}
