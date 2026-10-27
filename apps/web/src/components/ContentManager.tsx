"use client";

import { useEffect, useState } from "react";
import { EpisodeForm } from "@/components/admin/EpisodeForm";
import {
  NO_SUBTITLES,
  SubtitlePicker,
} from "@/components/admin/SubtitlePicker";
import { TitleForm } from "@/components/admin/TitleForm";
import { requestSubtitles } from "@/lib/adminApi";
import { portraitImage } from "@/lib/catalog";
import { deleteEpisode, deleteTitle } from "@/lib/deleteContent";
import { supabase } from "@/lib/supabase";
import type { Episode, Title } from "@/lib/types";

type Props = { token: string; version: number; onChanged: () => void };

// Bir satırın altında açılan panel: düzenleme formu veya altyazı seçici
type Panel = {
  kind: "edit-title" | "edit-episode" | "subtitles";
  id: string;
} | null;

// Yüklenen içeriklerin listesi: öne çıkarma, düzenleme, altyazı ve silme
export function ContentManager({ token, version, onChanged }: Props) {
  const [titles, setTitles] = useState<(Title & { episodes: Episode[] })[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [subtitles, setSubtitles] = useState(NO_SUBTITLES);

  const isOpen = (kind: NonNullable<Panel>["kind"], id: string) =>
    panel?.kind === kind && panel.id === id;
  const togglePanel = (kind: NonNullable<Panel>["kind"], id: string) => {
    setSubtitles(NO_SUBTITLES);
    setPanel(isOpen(kind, id) ? null : { kind, id });
  };
  const saved = (text: string) => {
    setPanel(null);
    setMessage(text);
    onChanged();
  };

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
    const what =
      title.kind === "film"
        ? "filmi"
        : `diziyi ve ${title.episodes.length} bölümünü`;
    if (
      !confirm(
        `"${title.name}" ${what} kalıcı olarak silmek istiyor musun? Videolar da silinir, geri alınamaz.`,
      )
    )
      return;
    run(title.id, () => deleteTitle(title, token), `"${title.name}" silindi.`);
  }

  function removeEpisode(title: Title, episode: Episode) {
    if (
      !confirm(
        `${title.name} S${episode.season}:B${episode.number} kalıcı olarak silinsin mi? Geri alınamaz.`,
      )
    )
      return;
    run(episode.id, () => deleteEpisode(episode, token), "Bölüm silindi.");
  }

  function addSubtitles(id: string, videoIds: string[]) {
    if (subtitles.targetLanguages.length === 0) {
      setMessage("En az bir dil seç.");
      return;
    }
    run(
      id,
      async () => {
        await requestSubtitles(videoIds, subtitles, token, { force: true });
        setPanel(null);
      },
      "Altyazı istendi. Bunny hazırlayınca (birkaç dakika) oynatıcıda görünür.",
    );
  }

  function subtitlePanel(id: string, videoIds: string[]) {
    return (
      <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
        <SubtitlePicker value={subtitles} onChange={setSubtitles} />
        <div className="flex gap-2">
          <button
            className="btn"
            disabled={busy !== null}
            onClick={() => addSubtitles(id, videoIds)}
          >
            {busy === id ? "İsteniyor…" : "Altyazı oluştur"}
          </button>
          <button className="btn-ghost" onClick={() => setPanel(null)}>
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  function toggleFeatured(title: Title) {
    run(
      title.id,
      async () => {
        const { error } = await supabase
          .from("titles")
          .update({ featured: !title.featured })
          .eq("id", title.id);
        if (error) throw error;
      },
      title.featured
        ? "Büyük afişten kaldırıldı."
        : "Büyük afişte gösterilecek.",
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold">
        <span className="bg-brand h-6 w-1.5 rounded-full" />
        İçeriklerim
      </h2>
      {message && <p className="text-sm text-white/80">{message}</p>}
      {titles.length === 0 && (
        <p className="text-white/60">Henüz bir şey yüklemedin.</p>
      )}

      <ul className="space-y-2">
        {titles.map((title) => {
          const poster = portraitImage(title);
          const episodes = [...title.episodes].sort(
            (a, b) => a.season - b.season || a.number - b.number,
          );
          return (
            <li key={title.id} className="rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 overflow-hidden rounded-lg bg-white/5 ${title.orientation === "vertical" ? "h-16 w-9" : "h-12 w-20"}`}
                >
                  {poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setOpen(open === title.id ? null : title.id)}
                >
                  <p className="truncate font-bold">{title.name}</p>
                  <p className="text-xs text-white/60">
                    {title.orientation === "vertical" ? "📱 Dikey" : "▭ Yatay"}{" "}
                    ·{" "}
                    {title.kind === "film"
                      ? "Film"
                      : `${title.episodes.length} bölüm ${open === title.id ? "▴" : "▾"}`}
                  </p>
                </button>
                <button
                  onClick={() => togglePanel("edit-title", title.id)}
                  className="chip"
                >
                  ✏️ Düzenle
                </button>
                {title.kind === "film" && title.video_uid && (
                  <button
                    onClick={() => togglePanel("subtitles", title.id)}
                    className="chip"
                  >
                    💬 Altyazı
                  </button>
                )}
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

              {isOpen("edit-title", title.id) && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <TitleForm
                    token={token}
                    existing={title}
                    onSaved={() => saved(`"${title.name}" güncellendi.`)}
                    onCancel={() => setPanel(null)}
                  />
                </div>
              )}
              {isOpen("subtitles", title.id) &&
                title.video_uid &&
                subtitlePanel(title.id, [title.video_uid])}

              {open === title.id && title.kind === "series" && (
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {episodes.length === 0 && (
                    <li className="text-sm text-white/60">Bölüm yok.</li>
                  )}
                  {episodes.length > 1 && (
                    <li>
                      <button
                        onClick={() => togglePanel("subtitles", title.id)}
                        className="chip text-xs"
                      >
                        💬 Tüm bölümlere altyazı
                      </button>
                      {isOpen("subtitles", title.id) &&
                        subtitlePanel(
                          title.id,
                          episodes.map((e) => e.video_uid),
                        )}
                    </li>
                  )}
                  {episodes.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-lg px-2 py-1 hover:bg-white/5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="w-16 text-sm font-bold text-white/70">
                          S{e.season}:B{e.number}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {e.name ?? `Bölüm ${e.number}`}
                        </span>
                        <button
                          onClick={() => togglePanel("edit-episode", e.id)}
                          className="chip !py-0.5 text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => togglePanel("subtitles", e.id)}
                          className="chip !py-0.5 text-xs"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => removeEpisode(title, e)}
                          disabled={busy !== null}
                          className="chip !py-0.5 text-xs hover:bg-red-600 disabled:opacity-50"
                        >
                          {busy === e.id ? "Siliniyor…" : "🗑 Sil"}
                        </button>
                      </div>
                      {isOpen("edit-episode", e.id) && (
                        <div className="mt-3">
                          <EpisodeForm
                            token={token}
                            version={version}
                            existing={e}
                            onSaved={() => saved("Bölüm güncellendi.")}
                            onCancel={() => setPanel(null)}
                          />
                        </div>
                      )}
                      {isOpen("subtitles", e.id) &&
                        subtitlePanel(e.id, [e.video_uid])}
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
