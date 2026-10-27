"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Title } from "@/lib/types";
import { uploadVideo } from "@/lib/uploadVideo";
import { useIsAdmin, useSession } from "@/lib/useSession";

export default function AdminPage() {
  const { session, loading } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);

  if (loading || (session && isAdmin === null)) return <p className="px-4 pt-24 opacity-60 sm:px-12">Yükleniyor…</p>;
  if (!session || !isAdmin) return <p className="px-4 pt-24 sm:px-12">Bu sayfa sadece yönetici içindir.</p>;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-24 md:grid-cols-2">
      <NewTitleForm token={session.access_token} />
      <NewEpisodeForm token={session.access_token} />
    </div>
  );
}

async function uploadPoster(file: File) {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("posters").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("posters").getPublicUrl(path).data.publicUrl;
}

function NewTitleForm({ token }: { token: string }) {
  const [kind, setKind] = useState<"film" | "series">("series");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const poster = data.get("poster") as File;
    const video = data.get("video") as File | null;

    setBusy(true);
    try {
      const poster_url = poster?.size ? await uploadPoster(poster) : null;
      let video_uid: string | null = null;
      if (kind === "film" && video?.size) {
        video_uid = await uploadVideo(video, token, (p) => setStatus(`Video yükleniyor: %${p}`));
      }
      const { error } = await supabase.from("titles").insert({
        kind,
        orientation,
        featured: data.get("featured") === "on",
        name: data.get("name"),
        description: data.get("description") || null,
        year: data.get("year") ? Number(data.get("year")) : null,
        poster_url,
        video_uid,
      });
      if (error) throw error;
      form.reset();
      setStatus(kind === "film" ? "Film eklendi. Bunny videoyu işledikten sonra izlenebilir." : "Dizi eklendi. Şimdi bölüm ekleyebilirsin.");
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-xl font-semibold">Yeni film / dizi</h2>
      <div className="flex gap-2">
        {(["series", "film"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`chip ${k === kind ? "chip-active" : ""}`}
          >
            {k === "series" ? "Dizi" : "Film"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {(["horizontal", "vertical"] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOrientation(o)}
            className={`chip ${o === orientation ? "chip-active" : ""}`}
          >
            {o === "horizontal" ? "▭ Yatay video" : "▯ Dikey video"}
          </button>
        ))}
      </div>
      <input className="input" name="name" placeholder="Ad" required />
      <textarea className="input" name="description" placeholder="Açıklama" rows={3} />
      <input className="input" name="year" type="number" placeholder="Yıl" />
      <label className="block text-sm opacity-70">
        Kapak görseli (isteğe bağlı, dikeyde 9:16 önerilir)
        <input className="input mt-1" name="poster" type="file" accept="image/*" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" /> Ana sayfadaki büyük afişte göster
      </label>
      {kind === "film" && (
        <label className="block text-sm opacity-70">
          Video dosyası
          <input className="input mt-1" name="video" type="file" accept="video/*" required />
        </label>
      )}
      <button className="btn" disabled={busy}>Kaydet</button>
      {status && <p className="text-sm opacity-80">{status}</p>}
    </form>
  );
}

function NewEpisodeForm({ token }: { token: string }) {
  const [series, setSeries] = useState<Title[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("titles")
      .select("*")
      .eq("kind", "series")
      .order("name")
      .then(({ data }) => setSeries(data ?? []));
  }, [status]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const video = data.get("video") as File;

    setBusy(true);
    try {
      const video_uid = await uploadVideo(video, token, (p) => setStatus(`Video yükleniyor: %${p}`));
      const { error } = await supabase.from("episodes").insert({
        title_id: data.get("title_id"),
        season: Number(data.get("season")),
        number: Number(data.get("number")),
        name: data.get("name") || null,
        description: data.get("description") || null,
        video_uid,
      });
      if (error) throw error;
      form.reset();
      setStatus("Bölüm eklendi. Bunny videoyu işledikten sonra izlenebilir.");
    } catch (err) {
      setStatus(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-xl font-semibold">Yeni bölüm</h2>
      <select className="input" name="title_id" required>
        <option value="">Dizi seç</option>
        {series.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="flex gap-3">
        <input className="input" name="season" type="number" min={1} placeholder="Sezon" required />
        <input className="input" name="number" type="number" min={1} placeholder="Bölüm" required />
      </div>
      <input className="input" name="name" placeholder="Bölüm adı" />
      <textarea className="input" name="description" placeholder="Açıklama" rows={2} />
      <label className="block text-sm opacity-70">
        Video dosyası
        <input className="input mt-1" name="video" type="file" accept="video/*" required />
      </label>
      <button className="btn" disabled={busy}>Yükle</button>
      {status && <p className="text-sm opacity-80">{status}</p>}
    </form>
  );
}
