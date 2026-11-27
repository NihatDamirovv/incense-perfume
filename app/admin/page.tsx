"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Upload,
  LogOut,
  Search,
  Package,
  Layers,
  ImagePlus,
} from "lucide-react";
import { type Product } from "../data";
import { seasons, productOrigin } from "../../lib/product-options";
import VisualEditor from "./visual-editor";
import Bottle from "../bottle";
import CmsPanel from "./cms-panel";
import {
  defaultSettings,
  type SiteSettings,
  type Brand,
} from "../site-content";
type ProductDraft = Omit<Product, "size" | "price" | "variants"> & {
  size: number | string;
  price: number | string;
  variants?: { size: number | string; price: number | string; available: boolean }[];
};
const blank: ProductDraft = {
  id: "",
  name: "",
  brand: "",
  price: "",
  size: "",
  gender: "Uniseks",
  family: "",
  notes: "",
  description: "",
  image: "",
  available: true,
  origin: "",
  seasons: [],
  variants: [],
};
export default function Admin() {
  const [password, setPassword] = useState(""),
    [authed, setAuthed] = useState(false),
    [items, setItems] = useState<Product[]>([]),
    [edit, setEdit] = useState<ProductDraft | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [deleting, setDeleting] = useState<Product | null>(null);
  const [section, setSection] = useState<
    "products" | "brands" | "content" | "visual"
  >("products");
  const [settings, setSettings] = useState<SiteSettings>({
      ...defaultSettings,
    }),
    [brands, setBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<{ data: SiteSettings }>)
      .then((s) => setSettings(s.data))
      .catch(() => {});
  }, []);
  async function load() {
    const [s, b] = await Promise.all([
      fetch("/api/settings").then(
        (r) => r.json() as Promise<{ data: SiteSettings }>,
      ),
      fetch("/api/brands").then((r) => r.json() as Promise<{ data: Brand[] }>),
    ]);
    if (s.data) setSettings(s.data);
    if (b.data) setBrands(b.data);
    const r = await fetch("/api/catalog");
    const data = (await r.json()) as Product[] & { error?: string };
    if (!r.ok) throw Error(data.error);
    setItems(data);
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/auth/check", {
        method: "POST",
        headers,
      });
      const result = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(result.error || "Giriş mümkün olmadı.");
      await load();
      setAuthed(true);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/catalog", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...edit,
          size: Number(edit!.size),
          price: Number(edit!.price),
          variants: (edit!.variants || []).map((v) => ({
            ...v, size: Number(v.size), price: Number(v.price),
          })),
        }),
      });
      const data = (await r.json()) as { error?: string; url: string };
      if (!r.ok) throw Error(data.error);
      await load();
      setEdit(null);
      setMessage("Məhsul yadda saxlanıldı.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
        body: form,
      });
      const data = (await r.json()) as { error?: string; url: string };
      if (!r.ok) throw Error(data.error);
      setEdit((p) => (p ? { ...p, image: data.url } : p));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      const r = await fetch("/api/catalog", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!r.ok) throw Error("Silinmə alınmadı.");
      await load();
      setDeleting(null);
      setMessage("Məhsul silindi.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin">
      <header>
        <a href="/" className="wordmark">
          {settings.logoImage ? (
            <img
              className="site-logo"
              src={settings.logoImage}
              alt={settings.siteName}
            />
          ) : (
            <>
              {settings.siteName}
              <span>İDARƏETMƏ PANELİ</span>
            </>
          )}
        </a>
        <a href="/">Mağazaya bax</a>
        {authed && (
          <button
            className="text-button"
            onClick={() => {
              setAuthed(false);
              setPassword("");
              setEdit(null);
              setMessage("");
            }}
          >
            <LogOut size={16} /> Çıxış
          </button>
        )}
      </header>
      {!authed ? (
        <main className="login">
          <div className="eyebrow">YALNIZ İDARƏÇİ ÜÇÜN</div>
          <h1>Xoş gəldiniz.</h1>
          <p>Kolleksiyanızı bir yerdən idarə edin.</p>
          <form onSubmit={login}>
            <label>
              Admin şifrəsi
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Yoxlanılır..." : "Daxil ol"}
            </button>
          </form>
          <p role="status">{message}</p>
        </main>
      ) : (
        <main className="admin-main">
          <nav className="admin-tabs" aria-label="Admin bölmələri">
            {(
              [
                { id: "products", name: "Məhsullar" },
                { id: "brands", name: "Brendlər" },
                { id: "content", name: "Sayt məzmunu" },
                { id: "visual", name: "Vizual redaktə" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                className={section === t.id ? "active" : ""}
                onClick={() => {
                  setSection(t.id);
                  setMessage("");
                }}
              >
                {t.name}
              </button>
            ))}
          </nav>
          {section === "products" && (
            <>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">MAĞAZANIZ</div>
                  <h1>Kolleksiyanı idarə edin.</h1>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    setEdit({ ...blank });
                    setMessage("");
                  }}
                >
                  <Plus size={18} /> Parfüm əlavə et
                </button>
              </div>
              <div className="stats">
                <div>
                  <Package />
                  <strong>{items.length}</strong>
                  <span>Parfüm</span>
                </div>
                <div>
                  <Layers />
                  <strong>{brands.length}</strong>
                  <span>Brend</span>
                </div>
                <div>
                  <ImagePlus />
                  <strong>{items.filter((p) => p.available).length}</strong>
                  <span>Stokda</span>
                </div>
              </div>
              <div className="admin-toolbar">
                <h2>Məhsullar</h2>
                <label className="search">
                  <Search size={18} />
                  <input
                    placeholder="Məhsul axtar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <p role="status" className="status">
                {message}
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Məhsul</th>
                      <th>Brend</th>
                      <th>Həcm</th>
                      <th>Qiymət</th>
                      <th>Status</th>
                      <th>Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter((p) =>
                        (p.name + " " + p.brand)
                          .toLocaleLowerCase("az")
                          .includes(search.toLocaleLowerCase("az")),
                      )
                      .map((p, i) => (
                        <tr key={p.id}>
                          <td>
                            <div className="table-product">
                              <div>
                                {p.image ? (
                                  <img src={p.image} alt="" />
                                ) : (
                                  <Bottle
                                    name={p.name}
                                    brand={p.brand}
                                    variant={i}
                                  />
                                )}
                              </div>
                              <strong>{p.name}</strong>
                            </div>
                          </td>
                          <td>{p.brand}</td>
                          <td>{[p.size, ...(p.variants || []).map((v) => v.size)].join(" / ")} ml</td>
                          <td>{p.price} ₼</td>
                          <td>
                            <span className="stock">
                              {p.available ? "Stokda" : "Tükənib"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="icon"
                              aria-label={p.name + " redaktə et"}
                              onClick={() => {
                                setEdit({ ...p });
                                setMessage("");
                              }}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              className="icon"
                              aria-label={p.name + " sil"}
                              onClick={() => setDeleting(p)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!items.length && (
                  <p className="empty">İlk parfümünüzü əlavə edin.</p>
                )}
              </div>
            </>
          )}
          {section === "visual" ? (
            <VisualEditor
              token={password}
              onEditProduct={(id) => {
                const p = items.find((x) => x.id === id);
                if (p) {
                  setSection("products");
                  setEdit(p);
                }
              }}
            />
          ) : (
            <CmsPanel token={password} active={section} onUpdate={load} />
          )}
        </main>
      )}
      {edit && (
        <div className="overlay">
          <section
            className="edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <div className="edit-heading">
              <h2 id="edit-title">
                {edit.id ? "Parfümü redaktə et" : "Yeni parfüm"}
              </h2>
              <button
                className="icon"
                disabled={busy}
                onClick={() => setEdit(null)}
                aria-label="Bağla"
              >
                <X />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="edit-grid">
                <div>
                  <div className="upload-preview">
                    {edit.image ? (
                      <img src={edit.image} alt="Məhsul şəkli" />
                    ) : (
                      <ImagePlus size={48} />
                    )}
                  </div>
                  <label className="upload-button">
                    <Upload size={17} /> Şəkil yüklə
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={busy}
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                  <small>JPG, PNG, WebP · Maksimum 5 MB</small>
                  {edit.image && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEdit({ ...edit, image: "" })}
                    >
                      Şəkli çıxar
                    </button>
                  )}
                </div>
                <div className="fields">
                  <label>
                    Parfümün adı
                    <input
                      required
                      maxLength={150}
                      value={edit.name}
                      onChange={(e) =>
                        setEdit({ ...edit, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Brend
                    <input
                      required
                      list="brand-options"
                      maxLength={150}
                      placeholder="Məsələn, Creed"
                      value={edit.brand}
                      onChange={(e) =>
                        setEdit({ ...edit, brand: e.target.value })
                      }
                    />
                    <datalist id="brand-options">
                      {brands.map((b) => (
                        <option key={b.id} value={b.name} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Mənşə
                    <select
                      value={productOrigin(edit)}
                      onChange={(e) =>
                        setEdit({ ...edit, origin: e.target.value })
                      }
                    >
                      <option value="">Seçilməyib</option>
                      <option>Avropa</option>
                      <option>Ərəb</option>
                    </select>
                  </label>
                  <fieldset className="season-editor">
                    <legend>Fəsillər — bir neçəsini seçə bilərsiniz</legend>
                    {seasons.map((season) => (
                      <label className="check-label" key={season}>
                        <input
                          type="checkbox"
                          checked={(edit.seasons || []).includes(season)}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              seasons: e.target.checked
                                ? [...(edit.seasons || []), season]
                                : (edit.seasons || []).filter(
                                    (x) => x !== season,
                                  ),
                            })
                          }
                        />
                        {season}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="variant-editor">
                    <legend>Həcmlər və qiymətlər</legend>
                    <p>
                      Hər ətri yalnız bir dəfə əlavə edin. Əlinizdə olan həcmləri
                      və hər birinin qiymətini burada yazın. Məsələn, 50 və 55 ml
                      əlavə etsəniz, müştəri yalnız bu iki həcmi görəcək.
                      100 ml və ya başqa həcm avtomatik əlavə edilmir.
                    </p>
                  <div className="variant-row">
                    <label>
                      Həcm (ml)
                      <input
                        required
                        type="number"
                        min="1"
                        value={edit.size}
                        placeholder="Məsələn, 50"
                        onChange={(e) =>
                          setEdit({ ...edit, size: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Qiymət (₼)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={edit.price}
                        onChange={(e) =>
                          setEdit({ ...edit, price: e.target.value })
                        }
                      />
                    </label>
                  </div>

                    {(edit.variants || []).map((v, i) => (
                      <div className="variant-row" key={i}>
                        <label>
                          Həcm (ml)
                          <input
                            aria-label={`Əlavə həcm ${i + 1}`}
                            type="number"
                            min="1"
                            max="10000"
                            required
                            value={v.size}
                            placeholder="Məsələn, 55"
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                variants: edit.variants!.map((x, j) =>
                                  j === i
                                    ? { ...x, size: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          Qiymət (₼)
                          <input
                            aria-label={`Əlavə qiymət ${i + 1}`}
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={v.price}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                variants: edit.variants!.map((x, j) =>
                                  j === i
                                    ? { ...x, price: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={v.available}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                variants: edit.variants!.map((x, j) =>
                                  j === i
                                    ? { ...x, available: e.target.checked }
                                    : x,
                                ),
                              })
                            }
                          />
                          Stokda
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEdit({
                              ...edit,
                              variants: edit.variants!.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="button light"
                      disabled={(edit.variants || []).length >= 20}
                      onClick={() =>
                        setEdit({
                          ...edit,
                          variants: [
                            ...(edit.variants || []),
                            { size: "", price: "", available: true },
                          ],
                        })
                      }
                    >
                      Həcm əlavə et
                    </button>
                  </fieldset>
                  <div className="field-row">
                    <label>
                      Kim üçün
                      <select
                        value={edit.gender}
                        onChange={(e) =>
                          setEdit({ ...edit, gender: e.target.value })
                        }
                      >
                        {["Uniseks", "Qadın", "Kişi"].map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ətir ailəsi
                      <input
                        placeholder="Odunsu"
                        value={edit.family}
                        onChange={(e) =>
                          setEdit({ ...edit, family: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Əsas notlar
                    <input
                      placeholder="Berqamot · Müşk · Səndəl"
                      value={edit.notes}
                      onChange={(e) =>
                        setEdit({ ...edit, notes: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Təsvir
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={edit.description}
                      onChange={(e) =>
                        setEdit({ ...edit, description: e.target.value })
                      }
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={edit.available}
                      onChange={(e) =>
                        setEdit({ ...edit, available: e.target.checked })
                      }
                    />{" "}
                    Stokda var
                  </label>
                </div>
              </div>
              <p role="status">{message}</p>
              <div className="form-actions">
                <button
                  type="button"
                  className="button light"
                  disabled={busy}
                  onClick={() => setEdit(null)}
                >
                  Ləğv et
                </button>
                <button className="button" disabled={busy}>
                  {busy ? "Gözləyin..." : "Yadda saxla"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleting && (
        <div className="overlay">
          <div className="confirm" role="alertdialog" aria-label="Məhsulu sil">
            <h2>Məhsul silinsin?</h2>
            <p>“{deleting.name}” kataloqdan çıxarılacaq.</p>
            <div className="form-actions">
              <button
                className="button light"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Ləğv et
              </button>
              <button className="button" disabled={busy} onClick={remove}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
