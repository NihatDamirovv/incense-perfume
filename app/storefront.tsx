"use client";
import { useEffect, useState } from "react";
import {
  Search,
  Heart,
  X,
  SlidersHorizontal,
  Plus,
  Minus,
  Menu,
  Check,
  ShieldCheck,
  Package,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";
import Bottle from "./bottle";
import ProductDetail from "./product-detail";
import { productOrigin, seasons, matchesPrice, productOptions } from "../lib/product-options";
import { type Product } from "./data";
import { defaultSettings, type SiteSettings, type Brand } from "./site-content";
import { useCart, CartPanel, checkout, type CartItem } from "./cart";
import {
  defaultFilters,
  catalogUrl,
  productUrl,
  filtersFromUrl,
  type CatalogFilters,
} from "../lib/store-routes";
export default function Storefront({
  initialProduct = null,
  initialFilters = defaultFilters,
  initialProducts = [],
  catalogView = false,
  pageView = "catalog",
}: {
  initialProduct?: Product | null;
  initialFilters?: CatalogFilters;
  initialProducts?: Product[];
  catalogView?: boolean;
  pageView?: "catalog" | "brands" | "about" | "contact";
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(!initialProducts.length),
    [brand, setBrand] = useState(initialFilters.brand),
    [gender, setGender] = useState(initialFilters.gender),
    [query, setQuery] = useState(initialFilters.query),
    [sort, setSort] = useState(initialFilters.sort),
    [active, setActive] = useState<Product | null>(initialProduct),
    [likes, setLikes] = useState<string[]>([]),
    [favorites, setFavorites] = useState(initialFilters.favorites),
    [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    ...defaultSettings,
  });
  const [brandEntries, setBrandEntries] = useState<Brand[]>([]);
  const [cartOpen, setCartOpen] = useState(false),
    [ordering, setOrdering] = useState(false),
    [orderError, setOrderError] = useState("");
  const [extra, setExtra] = useState({
    origin: initialFilters.origin,
    season: initialFilters.season,
    min: initialFilters.min,
    max: initialFilters.max,
  });
  const [visualEditing, setVisualEditing] = useState(false);
  const filters: CatalogFilters = {
    brand,
    gender,
    query,
    sort,
    favorites,
    ...extra,
  };
  useEffect(() => {
    const oldPaths: Record<string, string> = {
      "#contact": "/elaqe",
      "#story": "/haqqimizda",
      "#brands": "/brendler",
      "#collection": "/kolleksiya",
    };
    if (window.location.pathname === "/" && oldPaths[window.location.hash])
      window.location.replace(oldPaths[window.location.hash]);
    const editing =
      window.parent !== window &&
      new URLSearchParams(window.location.search).get("edit") === "1";
    if (!editing) return;
    setVisualEditing(true);
    document.body.classList.add("visual-editing");
    const receive = (e: MessageEvent) => {
      if (
        e.origin === location.origin &&
        e.source === window.parent &&
        e.data?.type === "incense-preview"
      )
        setSettings(e.data.settings);
    };
    const click = (e: MouseEvent) => {
      const element = (e.target as Element).closest("[data-edit]");
      if (element) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage(
          { type: "incense-edit", key: element.getAttribute("data-edit") },
          location.origin,
        );
      } else if ((e.target as Element).closest("[data-edit-product]")) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage(
          {
            type: "incense-edit-product",
            id: (e.target as Element)
              .closest("[data-edit-product]")!
              .getAttribute("data-edit-product"),
          },
          location.origin,
        );
      } else if ((e.target as Element).closest("a,button")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("message", receive);
    document.addEventListener("click", click, true);
    window.parent.postMessage({ type: "incense-ready" }, location.origin);
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("click", click, true);
      document.body.classList.remove("visual-editing");
    };
  }, []);
  function closeProduct() {
    window.location.assign(catalogUrl(filters));
  }
  function updateQuery(patch: Partial<CatalogFilters>) {
    const next = { ...filters, ...patch };
    setBrand(next.brand);
    setGender(next.gender);
    setQuery(next.query);
    setSort(next.sort);
    setFavorites(next.favorites);
    setExtra({
      origin: next.origin,
      season: next.season,
      min: next.min,
      max: next.max,
    });
    window.history.replaceState(window.history.state, "", catalogUrl(next));
  }
  useEffect(() => {
    const restore = () => {
      const next = filtersFromUrl(new URL(window.location.href));
      setBrand(next.brand);
      setGender(next.gender);
      setQuery(next.query);
      setSort(next.sort);
      setFavorites(next.favorites);
      setExtra({
        origin: next.origin,
        season: next.season,
        min: next.min,
        max: next.max,
      });
      if (!window.location.pathname.startsWith("/parfum/")) setActive(null);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    document.title = active
      ? `${active.brand} ${active.name} | ${settings.siteName}`
      : gender !== "Hamısı"
        ? `${gender} parfümləri | ${settings.siteName}`
        : pageView !== "catalog"
          ? `${{ brands: "Brendlər", about: "Haqqımızda", contact: "Əlaqə" }[pageView]} | ${settings.siteName}`
          : settings.seoTitle || settings.siteName;
  }, [active, gender, settings, pageView]);
  const cartState = useCart();
  async function order(items: CartItem[]) {
    setOrdering(true);
    setOrderError("");
    try {
      await checkout(items);
    } catch (e) {
      setOrderError((e as Error).message);
    } finally {
      setOrdering(false);
    }
  }
  function addToCart(id: string, size?: number) {
    cartState.add(id, size);
    setCartOpen(true);
    setOrderError("");
  }
  useEffect(() => {
    const refresh = () => {
      Promise.all([
        fetch("/api/settings").then((r) => {
          if (!r.ok) throw Error("Sayt məzmunu yüklənmədi.");
          return r.json() as Promise<{ data: SiteSettings }>;
        }),
        fetch("/api/brands").then((r) => {
          if (!r.ok) throw Error("Brendlər yüklənmədi.");
          return r.json() as Promise<{ data: Brand[] }>;
        }),
      ])
        .then(([s, b]) => {
          if (
            !(
              window.parent !== window &&
              new URLSearchParams(location.search).get("edit") === "1"
            )
          )
            setSettings(s.data);
          setBrandEntries(b.data);
        })
        .catch((e) => setError(e.message));
      fetch("/api/catalog")
        .then((r) => {
          if (!r.ok) throw Error("Kataloq yüklənmədi. Səhifəni yeniləyin.");
          return r.json() as Promise<Product[]>;
        })
        .then(setProducts)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    };
    refresh();
    window.addEventListener("focus", refresh);
    try {
      setLikes(JSON.parse(localStorage.getItem("noir-favorites") || "[]"));
    } catch {}
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const toggle = (id: string) =>
    setLikes((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem("noir-favorites", JSON.stringify(next));
      return next;
    });
  const brands = brandEntries.map((b) => b.name);
  const selectedBrand = brandEntries.find((b) => b.name === brand);
  const list = products
    .filter(
      (p) =>
        (brand === "Hamısı" || p.brand === brand) &&
        (gender === "Hamısı" || p.gender === gender) &&
        (!extra.origin || productOrigin(p) === extra.origin) &&
        (!extra.season || (p.seasons || []).includes(extra.season)) &&
        matchesPrice(p, extra.min, extra.max) &&
        (!favorites || likes.includes(p.id)) &&
        `${p.brand} ${p.name} ${p.notes}`
          .toLocaleLowerCase("az")
          .includes(query.toLocaleLowerCase("az")),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  const reset = () => {
    window.location.assign("/kolleksiya");
  };
  return (
    <>
      {settings.showAnnouncement &&
        (settings.announcement || visualEditing) && (
          <div className="announcement">
            {
              <span data-edit="announcement">
                {settings.announcement ||
                  (visualEditing ? "announcement · Edit" : "")}
              </span>
            }
          </div>
        )}
      <header>
        <a className="wordmark" href="/">
          {settings.logoImage ? (
            <img
              className="site-logo"
              src={settings.logoImage}
              alt={settings.siteName}
            />
          ) : (
            <>
              {
                <span data-edit="siteName">
                  {settings.siteName ||
                    (visualEditing ? "siteName · Edit" : "")}
                </span>
              }
              <span>
                {
                  <span data-edit="tagline">
                    {settings.tagline ||
                      (visualEditing ? "tagline · Edit" : "")}
                  </span>
                }
              </span>
            </>
          )}
        </a>
        <nav className={menu ? "nav open" : "nav"}>
          <a
            href="/kolleksiya"
            aria-current={
              pageView === "catalog" && catalogView && !active
                ? "page"
                : undefined
            }
          >
            {
              <span data-edit="navCollection">
                {settings.navCollection ||
                  (visualEditing ? "navCollection · Edit" : "")}
              </span>
            }
          </a>
          {true && (
            <a
              href="/brendler"
              aria-current={pageView === "brands" ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              {
                <span data-edit="navBrands">
                  {settings.navBrands ||
                    (visualEditing ? "navBrands · Edit" : "")}
                </span>
              }
            </a>
          )}
          {settings.showAbout && (
            <a
              href="/haqqimizda"
              aria-current={pageView === "about" ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              {
                <span data-edit="navAbout">
                  {settings.navAbout ||
                    (visualEditing ? "navAbout · Edit" : "")}
                </span>
              }
            </a>
          )}
          {settings.showContact && (
            <a
              href="/elaqe"
              aria-current={pageView === "contact" ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              {
                <span data-edit="navContact">
                  {settings.navContact ||
                    (visualEditing ? "navContact · Edit" : "")}
                </span>
              }
            </a>
          )}
        </nav>
        <div className="header-actions">
          <button
            className="icon cart-trigger"
            aria-label={"Səbət, " + cartState.count + " məhsul"}
            onClick={() => {
              setCartOpen(true);
              setOrderError("");
            }}
          >
            <ShoppingBag size={20} />
            {cartState.count > 0 && <small>{cartState.count}</small>}
          </button>
          <a
            href="/kolleksiya"
            aria-label="Axtarış"
            onClick={() =>
              setTimeout(() => document.getElementById("search")?.focus(), 100)
            }
          >
            <Search size={20} />
          </a>
          <a
            href={catalogUrl({ ...filters, favorites: !favorites })}
            className={favorites ? "selected" : ""}
            aria-label="Seçilmişlər"
          >
            <Heart size={20} />
            <small>{likes.length || ""}</small>
          </a>
          <button
            className="mobile-menu icon"
            aria-label="Menyu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      <main>
        {settings.showHero &&
          !catalogView &&
          !active &&
          pageView === "catalog" && (
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span />{" "}
                  {
                    <span data-edit="heroEyebrow">
                      {settings.heroEyebrow ||
                        (visualEditing ? "heroEyebrow · Edit" : "")}
                    </span>
                  }
                </div>
                <h1>
                  {
                    <span data-edit="heroTitle">
                      {settings.heroTitle ||
                        (visualEditing ? "heroTitle · Edit" : "")}
                    </span>
                  }
                  <br />
                  <em>
                    {
                      <span data-edit="heroEmphasis">
                        {settings.heroEmphasis ||
                          (visualEditing ? "heroEmphasis · Edit" : "")}
                      </span>
                    }
                  </em>
                </h1>
                <p className="preserve-lines">
                  {
                    <span data-edit="heroDescription">
                      {settings.heroDescription ||
                        (visualEditing ? "heroDescription · Edit" : "")}
                    </span>
                  }
                </p>
                <a className="button" href="/kolleksiya">
                  {
                    <span data-edit="heroButton">
                      {settings.heroButton ||
                        (visualEditing ? "heroButton · Edit" : "")}
                    </span>
                  }
                </a>
                <div className="hero-bottom">
                  <span>
                    {
                      <span data-edit="heroBadge">
                        {settings.heroBadge ||
                          (visualEditing ? "heroBadge · Edit" : "")}
                      </span>
                    }
                  </span>
                  <span>
                    {
                      <span data-edit="heroLocation">
                        {settings.heroLocation ||
                          (visualEditing ? "heroLocation · Edit" : "")}
                      </span>
                    }
                  </span>
                </div>
              </div>
              <div className="hero-art">
                {settings.heroImage ? (
                  <img
                    className="custom-hero-image"
                    src={settings.heroImage}
                    alt={settings.heroImageAlt}
                  />
                ) : (
                  <>
                    <div className="art-orbit" />
                    <div className="hero-bottle">
                      <Bottle
                        brand={settings.siteName}
                        name={settings.heroBottleName}
                        variant={8}
                      />
                    </div>
                    <div className="pedestal" />
                  </>
                )}
                <div className="art-caption preserve-lines">
                  {
                    <span data-edit="heroCaption">
                      {settings.heroCaption ||
                        (visualEditing ? "heroCaption · Edit" : "")}
                    </span>
                  }
                </div>
                <div className="art-bottom">
                  {
                    <span data-edit="heroArtLabel">
                      {settings.heroArtLabel ||
                        (visualEditing ? "heroArtLabel · Edit" : "")}
                    </span>
                  }
                  <span>
                    {
                      <span data-edit="heroArtType">
                        {settings.heroArtType ||
                          (visualEditing ? "heroArtType · Edit" : "")}
                      </span>
                    }
                  </span>
                </div>
              </div>
            </section>
          )}
        {active && (
          <ProductDetail
            product={products.find((p) => p.id === active.id) || active}
            products={products}
            settings={settings}
            onAdd={addToCart}
            onOrder={order}
            ordering={ordering}
            onFavorite={toggle}
            liked={likes.includes(active.id)}
          />
        )}
        {pageView === "brands" && (
          <section className="standalone-page">
            <h1>Brendlər</h1>
            <div className="brand-directory">
              {brandEntries.map((b) => (
                <a
                  href={catalogUrl({ ...defaultFilters, brand: b.name })}
                  key={b.id}
                >
                  {b.image && <img src={b.image} alt="" />}
                  <h2>{b.name}</h2>
                  {b.description && <p>{b.description}</p>}
                  <span>{b.count} parfüm</span>
                </a>
              ))}
            </div>
          </section>
        )}
        {!active && pageView === "catalog" && (
          <section className="collection" id="collection">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  {
                    <span data-edit="collectionEyebrow">
                      {settings.collectionEyebrow ||
                        (visualEditing ? "collectionEyebrow · Edit" : "")}
                    </span>
                  }
                </div>
                <h2>
                  {favorites ? (
                    "Seçilmiş ətirlər"
                  ) : gender !== "Hamısı" ? (
                    gender + " parfümləri"
                  ) : (
                    <span data-edit="collectionTitle">
                      {settings.collectionTitle ||
                        (visualEditing ? "Başlıq · Edit" : "")}
                    </span>
                  )}
                </h2>
              </div>
              <p className="preserve-lines">
                {
                  <span data-edit="collectionDescription">
                    {settings.collectionDescription ||
                      (visualEditing ? "collectionDescription · Edit" : "")}
                  </span>
                }
              </p>
            </div>
            <div className="unified-filters" aria-label="Parfüm filtrləri">
              <div className="filter-topline">
                <h3>Filtrlər</h3>
                <button onClick={reset}>Sıfırla</button>
              </div>
              <div className="filter-controls">
                <label>
                  Axtarış
                  <input
                    id="search"
                    placeholder="Ətir və ya brend axtarın"
                    value={query}
                    onChange={(e) => updateQuery({ query: e.target.value })}
                  />
                </label>
                <label>
                  Mənşə
                  <select
                    value={extra.origin}
                    onChange={(e) => updateQuery({ origin: e.target.value })}
                  >
                    <option value="">Hamısı</option>
                    <option>Avropa</option>
                    <option>Ərəb</option>
                  </select>
                </label>
                <label>
                  Brend
                  <select
                    value={brand}
                    onChange={(e) => updateQuery({ brand: e.target.value })}
                  >
                    {["Hamısı", ...brands].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Kim üçün
                  <select
                    value={gender}
                    onChange={(e) => updateQuery({ gender: e.target.value })}
                  >
                    {["Hamısı", "Qadın", "Kişi", "Uniseks"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Fəsil
                  <select
                    value={extra.season}
                    onChange={(e) => updateQuery({ season: e.target.value })}
                  >
                    <option value="">Hamısı</option>
                    {seasons.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <fieldset className="price-range">
                  <legend>Qiymət aralığı (₼)</legend>
                  <input
                    aria-label="Minimum qiymət"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Min"
                    value={extra.min}
                    onChange={(e) => updateQuery({ min: e.target.value })}
                  />
                  <span>–</span>
                  <input
                    aria-label="Maksimum qiymət"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Maks"
                    value={extra.max}
                    onChange={(e) => updateQuery({ max: e.target.value })}
                  />
                </fieldset>
                <label>
                  Sıralama
                  <select
                    value={sort}
                    onChange={(e) => updateQuery({ sort: e.target.value })}
                  >
                    <option value="selected">Standart</option>
                    <option value="low">Qiymət: azdan çoxa</option>
                    <option value="high">Qiymət: çoxdan aza</option>
                  </select>
                </label>
              </div>
              {extra.min &&
                extra.max &&
                Number(extra.min) > Number(extra.max) && (
                  <p role="alert">
                    Minimum qiymət maksimumdan böyük ola bilməz.
                  </p>
                )}
            </div>
            <div className="catalog-layout">
              <div className="catalog">
                <div className="result-count">
                  {list.length} parfüm{" "}
                  {brand !== "Hamısı" && <span> / {brand}</span>}
                  {favorites && (
                    <button onClick={() => updateQuery({ favorites: false })}>
                      Seçilmişlər ×
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="empty">Kolleksiya yüklənir...</div>
                ) : error ? (
                  <div className="empty">{error}</div>
                ) : !list.length ? (
                  <div className="empty">
                    <h3>Uyğun parfüm tapılmadı</h3>
                    <p>Axtarışı və ya filtrləri dəyişin.</p>
                    <button className="button" onClick={reset}>
                      Bütün kolleksiya
                    </button>
                  </div>
                ) : (
                  <div className="product-grid">
                    {list.map((p) => (
                      <article
                        className="product"
                        key={p.id}
                        data-edit-product={p.id}
                      >
                        <div className="product-image">
                          <button
                            className={
                              "favorite icon " +
                              (likes.includes(p.id) ? "liked" : "")
                            }
                            aria-label={
                              likes.includes(p.id)
                                ? "Seçilmişlərdən çıxar"
                                : "Seçilmişlərə əlavə et"
                            }
                            onClick={() => toggle(p.id)}
                          >
                            <Heart
                              size={18}
                              fill={
                                likes.includes(p.id) ? "currentColor" : "none"
                              }
                            />
                          </button>
                          {!p.available && (
                            <span className="badge">Tükənib</span>
                          )}
                          <a
                            className="image-button"
                            aria-label={p.name + " haqqında"}
                            href={productUrl(p.id, filters)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {p.image ? (
                              <img src={p.image} alt={p.brand + " " + p.name} />
                            ) : (
                              <Bottle
                                brand={p.brand}
                                name={p.name}
                                variant={products.indexOf(p)}
                              />
                            )}
                          </a>
                          <a
                            className="quick-view"
                            href={productUrl(p.id, filters)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ətraflı bax <Plus size={16} />
                          </a>
                        </div>
                        <div className="product-meta">
                          <span>{p.brand}</span>
                          <small>{p.gender}</small>
                        </div>
                        <a
                          className="product-name"
                          href={productUrl(p.id, filters)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {p.name}
                        </a>
                        <div className="product-bottom">
                          <span>Eau de Parfum · {productOptions(p).map((v) => v.size).join(" / ")} ml</span>
                          <strong>{Math.min(...productOptions(p).map((v) => v.price))} ₼{p.variants?.length ? "-dən" : ""}</strong>
                        </div>
                        <div className="product-actions">
                          {p.variants?.length ? (
                            <a className="button" href={productUrl(p.id, filters)} target="_blank" rel="noopener noreferrer">
                              Həcm seçin
                            </a>
                          ) : <>
                          <button
                            className="button"
                            disabled={!p.available || ordering}
                            onClick={() => order([{ id: p.id, quantity: 1 }])}
                          >
                            {
                              <span data-edit="orderButton">
                                {settings.orderButton ||
                                  (visualEditing ? "orderButton · Edit" : "")}
                              </span>
                            }
                          </button>
                          <button
                            className="cart-add"
                            disabled={!p.available}
                            aria-label={p.name + " " + settings.cartButton}
                            onClick={() => addToCart(p.id)}
                          >
                            <ShoppingBag size={16} />
                            <span>
                              {
                                <span data-edit="cartButton">
                                  {settings.cartButton ||
                                    (visualEditing ? "cartButton · Edit" : "")}
                                </span>
                              }
                            </span>
                          </button>
                          </>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {settings.showDemoNote && (
                  <p className="demo-note">
                    {
                      <span data-edit="demoNote">
                        {settings.demoNote ||
                          (visualEditing ? "demoNote · Edit" : "")}
                      </span>
                    }
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
        {pageView === "about" && (
          <section id="story" className="story">
            <span className="eyebrow">
              {
                <span data-edit="aboutEyebrow">
                  {settings.aboutEyebrow ||
                    (visualEditing ? "aboutEyebrow · Edit" : "")}
                </span>
              }
            </span>
            <h2>
              {
                <span data-edit="aboutTitle">
                  {settings.aboutTitle ||
                    (visualEditing ? "aboutTitle · Edit" : "")}
                </span>
              }
              <br />
              <em>
                {
                  <span data-edit="aboutEmphasis">
                    {settings.aboutEmphasis ||
                      (visualEditing ? "aboutEmphasis · Edit" : "")}
                  </span>
                }
              </em>
            </h2>
            <div>
              {settings.aboutImage && (
                <img
                  className="about-image"
                  src={settings.aboutImage}
                  alt={settings.navAbout}
                />
              )}
              <p className="preserve-lines">
                {
                  <span data-edit="aboutText">
                    {settings.aboutText ||
                      (visualEditing ? "aboutText · Edit" : "")}
                  </span>
                }
              </p>
              <p className="preserve-lines">
                {
                  <span data-edit="aboutTextExtra">
                    {settings.aboutTextExtra ||
                      (visualEditing ? "aboutTextExtra · Edit" : "")}
                  </span>
                }
              </p>
              <a href="/kolleksiya">
                {
                  <span data-edit="aboutButton">
                    {settings.aboutButton ||
                      (visualEditing ? "aboutButton · Edit" : "")}
                  </span>
                }
              </a>
              <div className="about-social-links">
                {settings.instagram && <a data-edit="instagram" href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
                {settings.tiktok && <a data-edit="tiktok" href={settings.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
              </div>
            </div>
          </section>
        )}
        {pageView === "contact" && (
          <section id="contact" className="contact-section">
            <div>
              <div className="eyebrow">
                {
                  <span data-edit="siteName">
                    {settings.siteName ||
                      (visualEditing ? "siteName · Edit" : "")}
                  </span>
                }
              </div>
              <h2>
                {
                  <span data-edit="contactTitle">
                    {settings.contactTitle ||
                      (visualEditing ? "contactTitle · Edit" : "")}
                  </span>
                }
              </h2>
              <p className="preserve-lines">
                {
                  <span data-edit="contactText">
                    {settings.contactText ||
                      (visualEditing ? "contactText · Edit" : "")}
                  </span>
                }
              </p>
            </div>
            <div className="contact-links">
              {settings.address && (
                <p>
                  {
                    <span data-edit="address">
                      {settings.address ||
                        (visualEditing ? "address · Edit" : "")}
                    </span>
                  }
                </p>
              )}
              {settings.phone && (
                <a href={"tel:" + settings.phone.replace(/[^+0-9]/g, "")}>
                  {
                    <span data-edit="phone">
                      {settings.phone || (visualEditing ? "phone · Edit" : "")}
                    </span>
                  }
                </a>
              )}
              {settings.email && (
                <a href={"mailto:" + settings.email}>
                  {
                    <span data-edit="email">
                      {settings.email || (visualEditing ? "email · Edit" : "")}
                    </span>
                  }
                </a>
              )}
              <a
                href={"https://wa.me/" + settings.whatsappNumber}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp · +{settings.whatsappNumber}
              </a>
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              )}
              {settings.tiktok && <a data-edit="tiktok" href={settings.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
            </div>
          </section>
        )}
      </main>
      <footer>
        <a className="wordmark" href="/">
          {settings.logoImage ? (
            <img
              className="site-logo"
              src={settings.logoImage}
              alt={settings.siteName}
            />
          ) : (
            <>
              {
                <span data-edit="siteName">
                  {settings.siteName ||
                    (visualEditing ? "siteName · Edit" : "")}
                </span>
              }
              <span>
                {
                  <span data-edit="tagline">
                    {settings.tagline ||
                      (visualEditing ? "tagline · Edit" : "")}
                  </span>
                }
              </span>
            </>
          )}
        </a>
        <span>
          © {new Date().getFullYear()}{" "}
          {
            <span data-edit="siteName">
              {settings.siteName || (visualEditing ? "siteName · Edit" : "")}
            </span>
          }
          .{" "}
          {
            <span data-edit="footerText">
              {settings.footerText ||
                (visualEditing ? "footerText · Edit" : "")}
            </span>
          }
        </span>
        {settings.showAdminLink && (
          <a href="/admin">
            <LockKeyhole size={14} /> Admin panel
          </a>
        )}
      </footer>
      {orderError && !cartOpen && (
        <div className="order-toast" role="alert">
          {orderError}
          <button
            className="icon"
            aria-label="Bildirişi bağla"
            onClick={() => setOrderError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {cartOpen && (
        <CartPanel
          items={cartState.cart}
          products={products}
          settings={settings}
          onClose={() => setCartOpen(false)}
          onQuantity={cartState.quantity}
          onCheckout={() => order(cartState.cart)}
          busy={ordering}
          error={orderError}
        />
      )}
    </>
  );
}
