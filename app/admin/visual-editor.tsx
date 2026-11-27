"use client";
import { useEffect, useRef, useState } from "react";
import {
  contentGroups,
  defaultSettings,
  type SiteSettings,
} from "../site-content";
import { ImageEditor } from "./cms-panel";
const fields = contentGroups.flatMap((g) => g.fields);
export default function VisualEditor({
  token,
  onEditProduct,
}: {
  token: string;
  onEditProduct: (id: string) => void;
}) {
  const [draft, setDraft] = useState<SiteSettings>({ ...defaultSettings }),
    [saved, setSaved] = useState<SiteSettings>({ ...defaultSettings }),
    [revision, setRevision] = useState(0),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState(""),
    [page, setPage] = useState("/"),
    [field, setField] = useState<keyof SiteSettings>("heroTitle");
  const frame = useRef<HTMLIFrameElement>(null);
  const current = useRef(draft);
  current.current = draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const selected = fields.find((f) => f.key === field)!;
  function send() {
    frame.current?.contentWindow?.postMessage(
      { type: "incense-preview", settings: current.current },
      location.origin,
    );
  }
  async function load() {
    try {
      const r = await fetch("/api/settings");
      if (!r.ok) throw Error("Məzmun yüklənmədi.");
      const s = (await r.json()) as { data: SiteSettings; revision: number };
      setDraft(s.data);
      setSaved(s.data);
      setRevision(s.revision);
      setReady(true);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      if (e.data?.type === "incense-ready") send();
      if (e.data?.type === "incense-edit-product") {
        if (dirty)
          setMessage(
            "Əvvəlcə mətn dəyişikliklərini yadda saxlayın və ya geri alın.",
          );
        else onEditProduct(e.data.id);
      }
      if (
        e.data?.type === "incense-edit" &&
        fields.some((f) => f.key === e.data.key)
      )
        setField(e.data.key);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [dirty, onEditProduct]);
  useEffect(() => {
    if (ready) send();
  }, [draft, ready]);
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
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: draft, revision }),
      });
      const result = (await r.json()) as {
        data: SiteSettings;
        revision: number;
        error?: string;
      };
      if (!r.ok) throw Error(result.error || "Yadda saxlanılmadı.");
      setDraft(result.data);
      setSaved(result.data);
      setRevision(result.revision);
      setMessage("Dəyişikliklər saytda yayımlandı.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="visual-editor">
      <div className="visual-toolbar">
        <div>
          <h1>Vizual redaktə</h1>
          <p>
            Önizləmədə mətnin üzərinə basın. Dəyişikliklər yalnız yadda
            saxladıqdan sonra yayımlanır.
          </p>
        </div>
        <button
          className="button"
          disabled={!ready || busy || uploading || !dirty}
          onClick={save}
        >
          {busy ? "Saxlanılır..." : "Dəyişiklikləri yadda saxla"}
        </button>
      </div>
      <p role="status">
        {message || (dirty ? "Yadda saxlanılmamış dəyişikliklər var." : "")}
      </p>
      {ready && (
        <div className="visual-layout">
          <div className="visual-controls">
            <label>
              Səhifə
              <select value={page} onChange={(e) => setPage(e.target.value)}>
                <option value="/">Ana səhifə</option>
                <option value="/kolleksiya">Kolleksiya</option>
                <option value="/brendler">Brendlər</option>
                <option value="/haqqimizda">Haqqımızda</option>
                <option value="/elaqe">Əlaqə</option>
              </select>
            </label>
            <label>
              Redaktə ediləcək sahə
              <select
                value={field}
                onChange={(e) => setField(e.target.value as keyof SiteSettings)}
              >
                {contentGroups.map((g) => (
                  <optgroup label={g.title} key={g.title}>
                    {g.fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {selected.kind === "toggle" ? (
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={Boolean(draft[field])}
                  onChange={(e) =>
                    setDraft({ ...draft, [field]: e.target.checked })
                  }
                />
                {selected.label}
              </label>
            ) : selected.kind === "image" ? (
              <ImageEditor
                value={String(draft[field])}
                onChange={(v) => setDraft({ ...draft, [field]: v })}
                token={token}
                label={selected.label}
                onBusy={setUploading}
              />
            ) : (
              <>
                <label>
                  {selected.label}
                  <textarea
                    rows={7}
                    value={String(draft[field])}
                    onChange={(e) =>
                      setDraft({ ...draft, [field]: e.target.value })
                    }
                  />
                </label>
                <button
                  className="button light"
                  onClick={() => setDraft({ ...draft, [field]: "" })}
                >
                  Mətni boşalt
                </button>
              </>
            )}
            <button
              className="text-button"
              onClick={() => setDraft(saved)}
              disabled={!dirty}
            >
              Yadda saxlanılmamış dəyişiklikləri geri al
            </button>
            <p>
              Gizlədilmiş və boş sahələri siyahıdan da seçə bilərsiniz. Məhsul
              mətnləri “Məhsullar”, brend adları isə “Brendlər” bölməsində
              dəyişir.
            </p>
          </div>
          <iframe
            ref={frame}
            title="Saytın canlı önizləməsi"
            src={`${page}?edit=1`}
            onLoad={send}
          />
        </div>
      )}
    </section>
  );
}
