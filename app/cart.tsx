"use client";
import { useEffect, useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import type { Product } from "./data";
import type { SiteSettings } from "./site-content";
import { optionFor } from "../lib/product-options";
export type CartItem = { id: string; quantity: number; size?: number };
const itemKey = (x: CartItem) => `${x.id}:${x.size ?? "base"}`;
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const data = JSON.parse(localStorage.getItem("incense-cart") || "[]");
        if (Array.isArray(data))
          setCart(
            data
              .filter(
                (x) =>
                  typeof x.id === "string" &&
                  Number.isInteger(x.quantity) &&
                  x.quantity > 0 &&
                  x.quantity <= 99,
              )
              .slice(0, 30),
          );
      } catch {}
    };
    read();
    const sync = (e: StorageEvent) => {
      if (e.key === "incense-cart") read();
    };
    window.addEventListener("storage", sync);
    setReady(true);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("incense-cart", JSON.stringify(cart));
      } catch {}
  }, [cart, ready]);
  function add(id: string, size?: number) {
    setCart((prev) => {
      const exists = prev.find((x) => x.id === id && x.size === size);
      return exists
        ? prev.map((x) =>
            x.id === id && x.size === size
              ? { ...x, quantity: Math.min(99, x.quantity + 1) }
              : x,
          )
        : prev.length < 30
          ? [...prev, { id, size, quantity: 1 }]
          : prev;
    });
  }
  function quantity(id: string, value: number, size?: number) {
    setCart((prev) =>
      value < 1
        ? prev.filter((x) => !(x.id === id && x.size === size))
        : prev.map((x) =>
            x.id === id && x.size === size
              ? { ...x, quantity: Math.min(99, value) }
              : x,
          ),
    );
  }
  return {
    cart,
    add,
    quantity,
    count: cart.reduce((n, x) => n + x.quantity, 0),
  };
}
export async function checkout(items: CartItem[]) {
  const r = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const result = (await r.json()) as { url?: string; error?: string };
  if (!r.ok || !result.url)
    throw Error(result.error || "Sifariş açıla bilmədi.");
  const url = new URL(result.url);
  if (url.origin !== "https://wa.me")
    throw Error("Sifariş ünvanı düzgün deyil.");
  window.location.assign(result.url);
}
export function CartPanel({
  items,
  products,
  settings,
  onClose,
  onQuantity,
  onCheckout,
  busy,
  error,
}: {
  items: CartItem[];
  products: Product[];
  settings: SiteSettings;
  onClose: () => void;
  onQuantity: (id: string, n: number, size?: number) => void;
  onCheckout: () => void;
  busy: boolean;
  error: string;
}) {
  const lines = items.map((item) => {
    const p = products.find((p) => p.id === item.id);
    const option = p ? optionFor(p, item.size) : undefined;
    return { ...item, product: p && option ? { ...p, ...option } : undefined };
  });
  const invalid = lines.some((x) => !x.product?.available);
  const total =
    lines.reduce(
      (sum, x) =>
        sum + (x.product ? Math.round(x.product.price * 100) * x.quantity : 0),
      0,
    ) / 100;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);
  return (
    <div className="overlay cart-overlay" onClick={onClose}>
      <section
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-heading">
          <h2 id="cart-title">
            Səbətiniz <small>{items.length} məhsul</small>
          </h2>
          <button
            autoFocus
            className="icon"
            aria-label="Səbəti bağla"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {!items.length ? (
          <div className="empty">
            <ShoppingBag size={40} />
            <h3>Səbətiniz boşdur</h3>
            <p>Bəyəndiyiniz ətirləri səbətə əlavə edin.</p>
            <button className="button" onClick={onClose}>
              Kolleksiyaya qayıt
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ id, quantity, size, product: p }) => (
                <article
                  className="cart-line"
                  key={itemKey({ id, size, quantity })}
                >
                  <div>
                    <span className="eyebrow">{p?.brand || "Məhsul"}</span>
                    <h3>{p?.name || "Artıq kataloqda yoxdur"}</h3>
                    <p>{p ? `${p.size} ml · ${p.price.toFixed(2)} ₼` : ""}</p>
                    {!p?.available && (
                      <p className="form-error">
                        Mövcud deyil — səbətdən çıxarın.
                      </p>
                    )}
                    <div className="quantity">
                      <button
                        aria-label={(p?.name || "Məhsul") + " sayını azalt"}
                        onClick={() => onQuantity(id, quantity - 1, size)}
                      >
                        <Minus size={14} />
                      </button>
                      <output>{quantity}</output>
                      <button
                        disabled={quantity >= 99}
                        aria-label={(p?.name || "Məhsul") + " sayını artır"}
                        onClick={() => onQuantity(id, quantity + 1, size)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-line-right">
                    <button
                      className="icon"
                      aria-label={(p?.name || "Məhsul") + " səbətdən çıxar"}
                      onClick={() => onQuantity(id, 0, size)}
                    >
                      <Trash2 size={17} />
                    </button>
                    <strong>
                      {p
                        ? (
                            (Math.round(p.price * 100) * quantity) /
                            100
                          ).toFixed(2) + " ₼"
                        : "—"}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Yekun məbləğ</span>
                <strong>{total.toFixed(2)} ₼</strong>
              </div>
              <p>Çatdırılma və mövcudluq WhatsApp-da təsdiqlənir.</p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button"
                disabled={busy || invalid}
                onClick={onCheckout}
              >
                {busy ? "Sifariş açılır..." : settings.checkoutButton}
              </button>
              <small>
                Mesaj hazırlanacaq. Göndərməyi WhatsApp-da siz təsdiqləyirsiniz.
              </small>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
