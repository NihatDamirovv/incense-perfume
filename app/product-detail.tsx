"use client";
import { useState } from "react";
import type { Product } from "./data";
import type { SiteSettings } from "./site-content";
import type { CartItem } from "./cart";
import { productOptions, productOrigin } from "../lib/product-options";
import { productUrl, catalogUrl, defaultFilters } from "../lib/store-routes";
import Bottle from "./bottle";

export default function ProductDetail({
  product: p,
  products,
  settings: s,
  onAdd,
  onOrder,
  ordering,
  onFavorite,
  liked,
}: {
  product: Product;
  products: Product[];
  settings: SiteSettings;
  onAdd: (id: string, size?: number) => void;
  onOrder: (items: CartItem[]) => void;
  ordering: boolean;
  onFavorite: (id: string) => void;
  liked: boolean;
}) {
  const [size, setSize] = useState(p.size);
  const options = productOptions(p);
  const selected = options.find((v) => v.size === size) || options[0];
  const related = products.filter(
    (x) =>
      x.id !== p.id &&
      x.brand.toLocaleLowerCase("az") === p.brand.toLocaleLowerCase("az"),
  );
  return (
    <article className="product-page">
      <nav className="breadcrumbs" aria-label="Səhifə yolu">
        <a href="/kolleksiya">Kolleksiya</a>
        <span>/</span>
        <a href={catalogUrl({ ...defaultFilters, brand: p.brand })}>
          {p.brand}
        </a>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="product-detail-top">
        <div className="detail-photo">
          {p.image ? (
            <img src={p.image} alt={`${p.brand} ${p.name}`} />
          ) : (
            <Bottle
              brand={p.brand}
              name={p.name}
              variant={products.findIndex((x) => x.id === p.id)}
            />
          )}
        </div>
        <div className="detail-summary">
          <p className="eyebrow">{p.brand}</p>
          <h1>{p.name}</h1>
          <p>{p.gender} · Eau de Parfum</p>
          <fieldset className="volume-picker">
            <legend>Həcm seçin</legend>
            {options.map((v) => (
              <button
                type="button"
                aria-pressed={selected.size === v.size}
                className={selected.size === v.size ? "selected" : ""}
                key={v.size}
                onClick={() => setSize(v.size)}
              >
                {v.size} ml{!v.available && <small>Tükənib</small>}
              </button>
            ))}
          </fieldset>
          <strong className="detail-price">
            {selected.price.toFixed(2)} ₼
          </strong>
          <p>{selected.available ? "Stokda var" : "Tükənib"}</p>
          <div className="detail-order-actions">
            <button
              className="button"
              disabled={!selected.available || ordering}
              onClick={() =>
                onOrder([{ id: p.id, size: selected.size, quantity: 1 }])
              }
            >
              {ordering ? "Sifariş açılır..." : s.orderButton}
            </button>
            <button
              className="button light"
              disabled={!selected.available}
              onClick={() => onAdd(p.id, selected.size)}
            >
              {s.cartButton}
            </button>
          </div>
          <button className="text-button" onClick={() => onFavorite(p.id)}>
            {liked ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"}
          </button>
        </div>
      </div>
      <section className="product-information">
        <h2>Məhsul haqqında</h2>
        {p.description && <p className="preserve-lines">{p.description}</p>}
        <dl>
          <dt>Brend</dt>
          <dd>{p.brand}</dd>
          <dt>Kim üçün</dt>
          <dd>{p.gender}</dd>
          {productOrigin(p) && (
            <>
              <dt>Mənşə</dt>
              <dd>{productOrigin(p)}</dd>
            </>
          )}
          {p.family && (
            <>
              <dt>Ətir ailəsi</dt>
              <dd>{p.family}</dd>
            </>
          )}
          {p.notes && (
            <>
              <dt>Əsas notlar</dt>
              <dd>{p.notes}</dd>
            </>
          )}
          {!!p.seasons?.length && (
            <>
              <dt>Fəsillər</dt>
              <dd>{p.seasons.length === 4 ? "4 fəsil" : p.seasons.join(" · ")}</dd>
            </>
          )}
          <dt>Həcmlər</dt>
          <dd>{options.map((v) => `${v.size} ml`).join(" · ")}</dd>
        </dl>
      </section>
      <section className="related-products">
        <h2>{p.brand} brendinin digər ətirləri</h2>
        {related.length ? (
          <div className="product-grid">
            {related.map((x) => (
              <a
                className="product"
                href={productUrl(x.id)}
                target="_blank"
                rel="noopener noreferrer"
                key={x.id}
              >
                <div className="product-image detail-related-image">
                  {x.image ? (
                    <img src={x.image} alt={x.name} />
                  ) : (
                    <Bottle
                      brand={x.brand}
                      name={x.name}
                      variant={products.indexOf(x)}
                    />
                  )}
                </div>
                <p>{x.brand}</p>
                <h3>{x.name}</h3>
                <p>
                  {productOptions(x).map((v) => v.size).join(" / ")} ml · {Math.min(...productOptions(x).map((v) => v.price))} ₼{x.variants?.length ? "-dən" : ""}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p>Bu brendin başqa ətri hələ əlavə edilməyib.</p>
        )}
      </section>
    </article>
  );
}
