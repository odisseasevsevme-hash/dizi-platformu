"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteCaption,
  fetchCaptions,
  loadCaptionText,
  saveCaption,
} from "@/lib/adminApi";
import { LANGUAGES } from "@/lib/languages";

type Caption = { srclang: string; label: string };

// Bir videonun altyazıları: listele, düzelt, dosyadan yükle, sil
export function CaptionEditor({
  videoId,
  token,
}: {
  videoId: string;
  token: string;
}) {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [editing, setEditing] = useState<{
    lang: string;
    label: string;
    text: string;
  } | null>(null);
  const [uploadLang, setUploadLang] = useState("tr");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchCaptions(videoId).then(setCaptions);
  }, [videoId]);

  useEffect(refresh, [refresh]);

  async function act(action: () => Promise<void>, done: string) {
    setBusy(true);
    setStatus(null);
    try {
      await action();
      setStatus(done);
      refresh();
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const labelOf = (lang: string) =>
    LANGUAGES.find((l) => l.code === lang)?.label ?? lang;

  async function startEdit(caption: Caption) {
    setStatus("Yükleniyor…");
    try {
      const text = await loadCaptionText(videoId, caption.srclang);
      setEditing({
        lang: caption.srclang,
        label: caption.label || labelOf(caption.srclang),
        text,
      });
      setStatus(null);
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    }
  }

  async function uploadFile(file: File) {
    const text = await file.text();
    await act(
      () => saveCaption(videoId, uploadLang, labelOf(uploadLang), text, token),
      `${labelOf(uploadLang)} altyazı yüklendi.`,
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">📝 Altyazılar</p>
        <button
          type="button"
          className="chip !px-2 !py-0.5 text-xs"
          onClick={refresh}
          title="Yenile"
        >
          🔄
        </button>
      </div>

      {captions === null && (
        <p className="text-sm text-white/60">Kontrol ediliyor…</p>
      )}
      {captions?.length === 0 && (
        <p className="text-sm text-white/60">
          Bu videonun henüz altyazısı yok.
        </p>
      )}
      <ul className="space-y-1">
        {captions?.map((c) => (
          <li key={c.srclang} className="flex items-center gap-2 text-sm">
            <span className="flex-1">
              {c.label || labelOf(c.srclang)}{" "}
              <span className="text-white/50">({c.srclang})</span>
            </span>
            <button
              type="button"
              className="chip !py-0.5 text-xs"
              disabled={busy}
              onClick={() => startEdit(c)}
            >
              ✏️ Düzelt
            </button>
            <button
              type="button"
              className="chip !py-0.5 text-xs hover:bg-red-600"
              disabled={busy}
              onClick={() =>
                confirm(`${c.label || c.srclang} altyazısı silinsin mi?`) &&
                act(
                  () => deleteCaption(videoId, c.srclang, token),
                  "Altyazı silindi.",
                )
              }
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="space-y-2">
          <p className="text-xs text-white/60">
            {editing.label} altyazısını düzeltiyorsun. Sadece yazıları değiştir;
            zaman satırlarına (00:00:01.000 --&gt; …) dokunma.
          </p>
          <textarea
            className="input font-mono text-xs"
            rows={14}
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await saveCaption(
                    videoId,
                    editing.lang,
                    editing.label,
                    editing.text,
                    token,
                  );
                  setEditing(null);
                }, "Altyazı kaydedildi. Oynatıcıda birkaç dakika içinde yeni hâli görünür.")
              }
            >
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setEditing(null)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        📄 Dosyadan yükle (.srt / .vtt):
        <select
          value={uploadLang}
          onChange={(e) => setUploadLang(e.target.value)}
          className="rounded-full border border-white/20 bg-surface px-3 py-1 text-white"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".srt,.vtt,text/vtt"
          disabled={busy}
          className="text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadFile(file);
          }}
        />
      </div>
      <p className="text-xs text-white/50">
        Aynı dilde altyazı varsa yüklediğin dosya onun yerine geçer.
      </p>

      {status && <p className="text-sm text-white/80">{status}</p>}
    </div>
  );
}
