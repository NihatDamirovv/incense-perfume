"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  ImagePlus,
  Save,
  Check,
} from "lucide-react";
import {
  defaultSettings,
  contentGroups,
  type SiteSettings,
  type Brand,
} from "../site-content";
type Envelope = { data: SiteSettings; revision: number };
async function api<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (r.status === 204) return undefined as T;
  const data = (await r.json()) as T & {
    error?: string;
    fields?: { field: string; message: string }[];
  };
  if (!r.ok) throw Error(data.error || "Sorğu uğursuz oldu.");
  return data;
}
export function ImageEditor({
  value,
  onChange,
  token,
  label,
  onBusy,
}: {
  value: string;
  onChange: (url: string) => void;
  token: string;
  label: string;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Şəkil maksimum 5 MB ola bilər.");
      return;
    }
    setBusy(true);
    onBusy?.(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await r.json()) as { url: string; error?: string };
      if (!r.ok) throw Error(data.error || "Yükləmə alınmadı.");
      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <div className="cms-image-field">
      <span className="field-label">{label}</span>
      <div className="cms-image-preview">
        {value ? <img src={value} alt={label} /> : <ImagePlus size={30} />}
      </div>
      <div className="cms-image-actions">
        <label className="upload-button">
          <Upload size={16} />
          {busy ? "Yüklənir..." : "Şəkil seç"}
          <input
            aria-label={label + " yüklə"}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={() => onChange("")}
          >
            Şəkli sil
          </button>
        )}
      </div>
      <small>JPG, PNG və WebP · 5 MB-dək</small>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
const newBrand = {
  name: "",
  description: "",
  image: "",
  featured: true,
  sortOrder: 0,
};
export default function CmsPanel({
  token,
  active,
  onUpdate,
}: {
  token: string;
  active: "products" | "brands" | "content";
  onUpdate: () => Promise<void>;
}) {
  const [brands, setBrands] = useState<Brand[]>([]),
    [draft, setDraft] = useState<SiteSettings>({ ...defaultSettings }),
    [saved, setSaved] = useState<SiteSettings>({ ...defaultSettings }),
    [revision, setRevision] = useState(0),
    [group, setGroup] = useState(0),
    [edit, setEdit] = useState<(typeof newBrand & { id?: string }) | null>(
      null,
    ),
    [removing, setRemoving] = useState<Brand | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  async function reload() {
    setLoadError("");
    try {
      const [b, s] = await Promise.all([
        api<{ data: Brand[] }>("/api/brands", token),
        api<Envelope>("/api/settings", token),
      ]);
      setBrands(b.data);
      setDraft(s.data);
      setSaved(s.data);
      setRevision(s.revision);
      setReady(true);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }
  useEffect(() => {
    reload();
  }, [token]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  async function saveContent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await api<Envelope>("/api/settings", token, {
        method: "PUT",
        body: JSON.stringify({ data: draft, revision }),
      });
      setDraft(result.data);
      setSaved(result.data);
      setRevision(result.revision);
      await onUpdate();
      setMessage("Dəyişikliklər saytda yayımlandı.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setMessage("");
    try {
      const { id, ...body } = edit;
      await api("/api/brands" + (id ? "/" + id : ""), token, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setBrands((await api<{ data: Brand[] }>("/api/brands", token)).data);
      await onUpdate();
      setEdit(null);
      setMessage("Brend yadda saxlanıldı.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      await api("/api/brands/" + removing.id, token, { method: "DELETE" });
      setBrands((await api<{ data: Brand[] }>("/api/brands", token)).data);
      await onUpdate();
      setRemoving(null);
      setMessage("Brend silindi.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (active === "products") return null;
  if (!ready)
    return (
      <div className="empty">
        {loadError || "İdarəetmə məlumatları yüklənir..."}
        {loadError && (
          <button className="button" onClick={reload}>
            Yenidən cəhd et
          </button>
        )}
      </div>
    );
  return (
    <section className="cms-panel">
      {active === "brands" ? (
        <>
          <div className="section-heading">
            <div>
              <div className="eyebrow">KOLLEKSİYANIN İMZALARI</div>
              <h1>Brendlər</h1>
              <p>
                Məhsul olmadan da brend əlavə edin. Ad dəyişikliyi məhsullara da
                tətbiq edilir.
              </p>
            </div>
            <button
              className="button"
              onClick={() => {
                setEdit({ ...newBrand });
                setMessage("");
              }}
            >
              <Plus size={17} /> Brend əlavə et
            </button>
          </div>
          <p role="status" className="status">
            {message}
          </p>
          <div className="brand-admin-grid">
            {brands.map((b) => (
              <article key={b.id} className="brand-admin-card">
                <div className="brand-admin-logo">
                  {b.image ? (
                    <img src={b.image} alt={b.name} />
                  ) : (
                    <span>{b.name}</span>
                  )}
                </div>
                <div className="brand-card-body">
                  <h2>{b.name}</h2>
                  <p>{b.description || "Brend təsviri əlavə edilməyib."}</p>
                  <div className="brand-card-meta">
                    <span>{b.count} məhsul</span>
                    <span>
                      {b.featured ? "Ana səhifədə" : "Yalnız filtrdə"}
                    </span>
                  </div>
                  <div className="brand-card-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        const { count, ...data } = b;
                        setEdit(data);
                        setMessage("");
                      }}
                    >
                      <Pencil size={15} /> Redaktə et
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setRemoving(b);
                        setMessage("");
                      }}
                    >
                      <Trash2 size={15} /> Sil
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!brands.length && (
            <p className="empty">İlk brendinizi əlavə edin.</p>
          )}
        </>
      ) : (
        <form onSubmit={saveContent}>
          <div className="section-heading cms-heading">
            <div>
              <div className="eyebrow">MƏZMUN İDARƏETMƏSİ</div>
              <h1>Sayt sizin əlinizdə.</h1>
              <p>Mətnləri, şəkilləri və əlaqə məlumatlarını buradan dəyişin.</p>
            </div>
            <div className="cms-save">
              <span>
                {dirty
                  ? "Yadda saxlanılmamış dəyişikliklər"
                  : "Bütün dəyişikliklər saxlanılıb"}
              </span>
              <button className="button" disabled={busy || uploading || !dirty}>
                <Save size={16} />
                {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
              </button>
            </div>
          </div>
          <p className="status" role="status">
            {message}
          </p>
          <div className="cms-layout">
            <nav className="cms-sections" aria-label="Məzmun bölmələri">
              {contentGroups.map((g, i) => (
                <button
                  type="button"
                  key={g.title}
                  aria-current={i === group ? "page" : undefined}
                  className={i === group ? "active" : ""}
                  onClick={() => {
                    setGroup(i);
                    setMessage("");
                  }}
                >
                  {g.title}
                </button>
              ))}
              <a href="/" target="_blank" rel="noreferrer">
                Mağazaya bax
              </a>
            </nav>
            <div className="cms-editor">
              <h2>{contentGroups[group].title}</h2>
              <p>{contentGroups[group].description}</p>
              <div className="fields">
                {contentGroups[group].fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.kind === "image" ? "cms-wide" : ""}
                  >
                    {field.kind === "image" ? (
                      <ImageEditor
                        label={field.label}
                        value={String(draft[field.key])}
                        token={token}
                        onBusy={setUploading}
                        onChange={(value) =>
                          setDraft((d) => ({ ...d, [field.key]: value }))
                        }
                      />
                    ) : field.kind === "toggle" ? (
                      <label className="check-label cms-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(draft[field.key])}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [field.key]: e.target.checked,
                            }))
                          }
                        />
                        {field.label}
                      </label>
                    ) : (
                      <label>
                        {field.label}
                        {field.kind === "textarea" ? (
                          <textarea
                            rows={4}
                            maxLength={5000}
                            value={String(draft[field.key])}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                [field.key]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <input
                            type={
                              field.kind === "email"
                                ? "email"
                                : field.kind === "url"
                                  ? "url"
                                  : "text"
                            }
                            required={
                              field.key === "siteName" ||
                              field.key === "whatsappNumber"
                            }
                            maxLength={field.key === "siteName" ? 80 : 5000}
                            value={String(draft[field.key])}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                [field.key]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </label>
                    )}
                    {field.hint && (
                      <small className="field-hint">{field.hint}</small>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}
      {edit && (
        <div className="overlay">
          <section
            className="edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-edit-title"
          >
            <div className="edit-heading">
              <h2 id="brand-edit-title">
                {edit.id ? "Brendi redaktə et" : "Yeni brend"}
              </h2>
              <button
                className="icon"
                disabled={busy || uploading}
                onClick={() => setEdit(null)}
                aria-label="Brend pəncərəsini bağla"
              >
                <X />
              </button>
            </div>
            <form onSubmit={saveBrand}>
              <div className="edit-grid">
                <ImageEditor
                  label="Brend loqosu"
                  value={edit.image}
                  token={token}
                  onBusy={setUploading}
                  onChange={(image) =>
                    setEdit((b) => (b ? { ...b, image } : b))
                  }
                />
                <div className="fields">
                  <label>
                    Brendin adı
                    <input
                      autoFocus
                      required
                      maxLength={150}
                      value={edit.name}
                      onChange={(e) =>
                        setEdit({ ...edit, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Brend haqqında
                    <textarea
                      rows={4}
                      maxLength={2000}
                      value={edit.description}
                      onChange={(e) =>
                        setEdit({ ...edit, description: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Sıra nömrəsi
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      required
                      value={edit.sortOrder}
                      onChange={(e) =>
                        setEdit({ ...edit, sortOrder: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={edit.featured}
                      onChange={(e) =>
                        setEdit({ ...edit, featured: e.target.checked })
                      }
                    />{" "}
                    Ana səhifənin brend zolağında göstər
                  </label>
                </div>
              </div>
              <p role="status">{message}</p>
              <div className="form-actions">
                <button
                  type="button"
                  className="button light"
                  disabled={busy || uploading}
                  onClick={() => setEdit(null)}
                >
                  Ləğv et
                </button>
                <button className="button" disabled={busy || uploading}>
                  {busy ? "Saxlanılır..." : "Brendi saxla"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {removing && (
        <div className="overlay">
          <section
            className="confirm"
            role="alertdialog"
            aria-labelledby="remove-brand"
          >
            <h2 id="remove-brand">
              {removing.count ? "Bu brendin məhsulları var" : "Brend silinsin?"}
            </h2>
            <p>
              {removing.count
                ? `“${removing.name}” brendində ${removing.count} məhsul var. Əvvəl məhsulları başqa brendə keçirin və ya silin.`
                : `“${removing.name}” siyahıdan çıxarılacaq.`}
            </p>
            <p role="alert">{message}</p>
            <div className="form-actions">
              <button
                className="button light"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Bağla
              </button>
              {!removing.count && (
                <button className="button" disabled={busy} onClick={remove}>
                  Brendi sil
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
