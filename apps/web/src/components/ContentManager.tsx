"use client";

import { useEffect, useState } from "react";
import { deleteEpisode, deleteTitle } from "@/lib/deleteContent";
import { posterFor, thumbnailUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import type { Episode, Title } from "@/lib/types";

type Props = { token: string; version: number; onChanged: () => void };

// Yüklenen içeriklerin listesi: öne çıkarma ve silme
export function ContentManager({ token, version, onChanged }: Props) {
  const [titles, setTitles] = useState<(Title & { episodes: Episode[] })[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("titles")
      .select("*, episodes(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTitles(data ?? []));
  }, [version]);

  async function run(id: string, action: () => Promise<void>, done: string) {
    setBusy(id);
    setMessage(null);
    try {
      await action();
      setMessage(done);
      onChanged();
    } catch (err) {
      setMessage(`Hata: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  function removeTitle(title: Title & { episodes: Episode[] }) {
    const what = title.kind === "film" ? "filmi" : `diziyi ve ${title.episodes.length} bölümünü`;
    if (!confirm(`"${title.name}" ${what} kalıcı olarak silmek istiyor musun? Videolar da silinir, geri alınamaz.`)) return;
    run(title.id, () => deleteTitle(title, token), `"${title.name}" silindi.`);
  }

  function removeEpisode(title: Title, episode: Episode) {
    if (!confirm(`${title.name} S${episode.season}:B${episode.number} kalıcı olarak silinsin mi? Geri alınamaz.`)) return;
    run(episode.id, () => deleteEpisode(episode, token), "Bölüm silindi.");
  }

  function toggleFeatured(title: Title) {
    run(
      title.id,
      async () => {
        const { error } = await supabase.from("titles").update({ featured: !title.featured }).eq("id", title.id);
        if (error) throw error;
      },
      title.featured ? "Büyük afişten kaldırıldı." : "Büyük afişte gösterilecek.",
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold">
        <span className="bg-brand h-6 w-1.5 rounded-full" />
        İçeriklerim
      </h2>
      {message && <p className="text-sm text-white/80">{message}</p>}
      {titles.length === 0 && <p className="text-white/60">Henüz bir şey yüklemedin.</p>}

      <ul className="space-y-2">
        {titles.map((title) => {
          const poster = posterFor(title) ?? (title.episodes[0] ? thumbnailUrl(title.episodes[0].video_uid) : null);
          const episodes = [...title.episodes].sort((a, b) => a.season - b.season || a.number - b.number);
          return (
            <li key={title.id} className="rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 overflow-hidden rounded-lg bg-white/5 ${title.orientation === "vertical" ? "h-16 w-9" : "h-12 w-20"}`}>
                  {poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === title.id ? null : title.id)}>
                  <p className="truncate font-bold">{title.name}</p>
                  <p className="text-xs text-white/60">
                    {title.orientation === "vertical" ? "📱 Dikey" : "▭ Yatay"} · {title.kind === "film" ? "Film" : `${title.episodes.length} bölüm ${open === title.id ? "▴" : "▾"}`}
                  </p>
                </button>
                <button
                  onClick={() => toggleFeatured(title)}
                  disabled={busy !== null}
                  title="Ana sayfadaki büyük afişte göster"
                  className={`chip ${title.featured ? "bg-sun text-black hover:bg-sun" : ""}`}
                >
                  {title.featured ? "★ Afişte" : "☆ Afiş"}
                </button>
                <button
                  onClick={() => removeTitle(title)}
                  disabled={busy !== null}
                  className="chip hover:bg-red-600 disabled:opacity-50"
                >
                  {busy === title.id ? "Siliniyor…" : "🗑 Sil"}
                </button>
              </div>

              {open === title.id && title.kind === "series" && (
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {episodes.length === 0 && <li className="text-sm text-white/60">Bölüm yok.</li>}
                  {episodes.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-white/5">
                      <span className="w-16 text-sm font-bold text-white/70">
                        S{e.season}:B{e.number}
                      </span>
                      <span className="flex-1 truncate text-sm">{e.name ?? `Bölüm ${e.number}`}</span>
                      <button
                        onClick={() => removeEpisode(title, e)}
                        disabled={busy !== null}
                        className="chip !py-0.5 text-xs hover:bg-red-600 disabled:opacity-50"
                      >
                        {busy === e.id ? "Siliniyor…" : "🗑 Sil"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
