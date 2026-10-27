"use client";

import { useEffect, useState } from "react";
import { NO_SUBTITLES, SubtitlePicker } from "@/components/admin/SubtitlePicker";
import { requestSubtitles } from "@/lib/adminApi";
import { formatTime, parseTime } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import type { Episode, Title } from "@/lib/types";
import { uploadVideo } from "@/lib/uploadVideo";

type Props = {
  token: string;
  version: number;
  existing?: Episode;
  onSaved: () => void;
  onCancel?: () => void;
};

export function EpisodeForm({ token, version, existing, onSaved, onCancel }: Props) {
  const [series, setSeries] = useState<Title[]>([]);
  const [subtitles, setSubtitles] = useState(NO_SUBTITLES);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing) return;
    supabase
      .from("titles")
      .select("*")
      .eq("kind", "series")
      .order("name")
      .then(({ data }) => setSeries(data ?? []));
  }, [version, existing]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    try {
      const fields = {
        season: Number(data.get("season")),
        number: Number(data.get("number")),
        name: data.get("name") || null,
        description: data.get("description") || null,
        intro_start_seconds: parseTime(data.get("intro_start")),
        intro_end_seconds: parseTime(data.get("intro_end")),
      };

      if (existing) {
        const { error } = await supabase.from("episodes").update(fields).eq("id", existing.id);
        if (error) throw error;
        setStatus("Kaydedildi.");
      } else {
        const video = data.get("video") as File;
        const video_uid = await uploadVideo(video, token, (p) => setStatus(`Video yükleniyor: %${p}`));
        const { error } = await supabase.from("episodes").insert({ ...fields, title_id: data.get("title_id"), video_uid });
        if (error) throw error;
        let message = "Bölüm eklendi. Bunny videoyu işledikten sonra izlenebilir.";
        try {
          await requestSubtitles([video_uid], subtitles, token);
          if (subtitles.targetLanguages.length) message += " Altyazılar hazırlanıyor.";
        } catch (err) {
          message += ` ${(err as Error).message}. İçeriklerim'den sonra tekrar deneyebilirsin.`;
        }
        form.reset();
        setStatus(message);
      }
      onSaved();
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!existing && <h2 className="text-xl font-bold">Yeni bölüm</h2>}
      {!existing && (
        <select className="input" name="title_id" required>
          <option value="">Dizi seç</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-3">
        <input className="input" name="season" type="number" min={1} placeholder="Sezon" required defaultValue={existing?.season ?? 1} />
        <input className="input" name="number" type="number" min={1} placeholder="Bölüm" required defaultValue={existing?.number} />
      </div>
      <input className="input" name="name" placeholder="Bölüm adı" defaultValue={existing?.name ?? ""} />
      <textarea className="input" name="description" placeholder="Açıklama" rows={2} defaultValue={existing?.description ?? ""} />
      <div className="space-y-1">
        <p className="text-sm text-white/70">⏭ Jenerik (isteğe bağlı, dakika:saniye). İzleyiciye &quot;Jeneriği atla&quot; butonu çıkar.</p>
        <div className="flex gap-3">
          <input className="input" name="intro_start" placeholder="Başlangıç, ör. 0:30" defaultValue={formatTime(existing?.intro_start_seconds ?? null)} />
          <input className="input" name="intro_end" placeholder="Bitiş, ör. 1:45" defaultValue={formatTime(existing?.intro_end_seconds ?? null)} />
        </div>
      </div>
      {!existing && (
        <>
          <label className="block text-sm text-white/70">
            Video dosyası
            <input className="input mt-1" name="video" type="file" accept="video/*" required />
          </label>
          <SubtitlePicker value={subtitles} onChange={setSubtitles} />
        </>
      )}
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>
          {busy ? "Kaydediliyor…" : existing ? "Kaydet" : "Yükle"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Vazgeç
          </button>
        )}
      </div>
      {status && <p className="text-sm text-white/80">{status}</p>}
    </form>
  );
}
