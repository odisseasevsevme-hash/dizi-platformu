"use client";

import { useState } from "react";
import { NO_SUBTITLES, SubtitlePicker } from "@/components/admin/SubtitlePicker";
import { deleteImage, deleteVideos, requestSubtitles, uploadImage } from "@/lib/adminApi";
import { supabase } from "@/lib/supabase";
import type { Title } from "@/lib/types";
import { uploadVideo } from "@/lib/uploadVideo";

type Props = {
  token: string;
  // Verilirse düzenleme, verilmezse yeni kayıt
  existing?: Title;
  onSaved: () => void;
  onCancel?: () => void;
};

export function TitleForm({ token, existing, onSaved, onCancel }: Props) {
  const [kind, setKind] = useState<"film" | "series">(existing?.kind ?? "series");
  const [orientation, setOrientation] = useState(existing?.orientation ?? "horizontal");
  const [subtitles, setSubtitles] = useState(NO_SUBTITLES);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = (name: string) => {
      const f = data.get(name) as File | null;
      return f?.size ? f : null;
    };

    setBusy(true);
    try {
      const poster = file("poster");
      const backdrop = file("backdrop");
      const trailer = file("trailer");
      const video = file("video");

      const poster_url = poster ? await uploadImage(poster) : existing?.poster_url ?? null;
      const backdrop_url = backdrop ? await uploadImage(backdrop) : existing?.backdrop_url ?? null;
      const trailer_uid = trailer
        ? await uploadVideo(trailer, token, (p) => setStatus(`Fragman yükleniyor: %${p}`))
        : existing?.trailer_uid ?? null;
      let video_uid = existing?.video_uid ?? null;
      if (!existing && kind === "film" && video) {
        video_uid = await uploadVideo(video, token, (p) => setStatus(`Film yükleniyor: %${p}`));
      }

      const fields = {
        orientation,
        featured: data.get("featured") === "on",
        name: data.get("name"),
        description: data.get("description") || null,
        year: data.get("year") ? Number(data.get("year")) : null,
        genres: String(data.get("genres") ?? "")
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        poster_url,
        backdrop_url,
        trailer_uid,
      };
      const { error } = existing
        ? await supabase.from("titles").update(fields).eq("id", existing.id)
        : await supabase.from("titles").insert({ ...fields, kind, video_uid });
      if (error) throw error;

      // Değiştirilen eski dosyaları temizle
      if (existing) {
        if (poster) await deleteImage(existing.poster_url);
        if (backdrop) await deleteImage(existing.backdrop_url);
        if (trailer && existing.trailer_uid) await deleteVideos([existing.trailer_uid], token);
      }

      let message = existing ? "Kaydedildi." : kind === "film" ? "Film eklendi." : "Dizi eklendi. Şimdi bölüm ekleyebilirsin.";
      if (!existing && video_uid) {
        try {
          await requestSubtitles([video_uid], subtitles, token);
          if (subtitles.targetLanguages.length) message += " Altyazılar hazırlanıyor.";
        } catch (err) {
          message += ` ${(err as Error).message}. İçeriklerim'den sonra tekrar deneyebilirsin.`;
        }
      }
      if (!existing) {
        form.reset();
        setSubtitles(NO_SUBTITLES);
      }
      setStatus(message);
      onSaved();
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!existing && <h2 className="text-xl font-bold">Yeni film / dizi</h2>}
      {!existing && (
        <div className="flex gap-2">
          {(["series", "film"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`chip ${k === kind ? "chip-active" : ""}`}>
              {k === "series" ? "🍿 Dizi" : "🎬 Film"}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {(["horizontal", "vertical"] as const).map((o) => (
          <button key={o} type="button" onClick={() => setOrientation(o)} className={`chip ${o === orientation ? "chip-active" : ""}`}>
            {o === "horizontal" ? "▭ Yatay video" : "▯ Dikey video"}
          </button>
        ))}
      </div>
      <input className="input" name="name" placeholder="Ad" required defaultValue={existing?.name} />
      <textarea className="input" name="description" placeholder="Açıklama" rows={3} defaultValue={existing?.description ?? ""} />
      <div className="flex gap-3">
        <input className="input" name="year" type="number" placeholder="Yıl" defaultValue={existing?.year ?? ""} />
        <input className="input" name="genres" placeholder="Türler: Dram, Romantik, Komedi" defaultValue={existing?.genres?.join(", ")} />
      </div>

      <ImageInput
        name="poster"
        label={orientation === "vertical" ? "Kapak / afiş (dikey 9:16)" : "Kapak / afiş (dikey 2:3)"}
        current={existing?.poster_url}
      />
      <ImageInput name="backdrop" label="Yatay arka plan görseli (16:9, ana sayfadaki büyük afişte ve kartlarda)" current={existing?.backdrop_url} />

      <label className="block text-sm text-white/70">
        🎬 Fragman videosu (isteğe bağlı{existing?.trailer_uid ? ", seçersen eskisinin yerine geçer" : ""})
        <input className="input mt-1" name="trailer" type="file" accept="video/*" />
      </label>

      {!existing && kind === "film" && (
        <>
          <label className="block text-sm text-white/70">
            Film dosyası
            <input className="input mt-1" name="video" type="file" accept="video/*" required />
          </label>
          <SubtitlePicker value={subtitles} onChange={setSubtitles} />
        </>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={existing?.featured} /> Ana sayfadaki büyük afişte göster
      </label>
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>
          {busy ? "Kaydediliyor…" : "Kaydet"}
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

function ImageInput({ name, label, current }: { name: string; label: string; current?: string | null }) {
  return (
    <label className="flex items-center gap-3 text-sm text-white/70">
      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      )}
      <span className="flex-1">
        {label}
        <input className="input mt-1" name={name} type="file" accept="image/*" />
      </span>
    </label>
  );
}
