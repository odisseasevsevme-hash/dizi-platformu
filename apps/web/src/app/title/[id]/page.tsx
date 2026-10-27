"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MyListButton } from "@/components/MyListButton";
import { TrailerBackground, TrailerModal } from "@/components/Trailer";
import { landscapeImage, portraitImage, resumeTarget, sortedEpisodes, watchHref } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import type { Episode, Title, WatchProgress } from "@/lib/types";
import { useMyList } from "@/lib/useMyList";
import { useProgress } from "@/lib/useProgress";

const FADE = "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]";

export default function TitlePage() {
  return (
    <Suspense>
      <TitleDetail />
    </Suspense>
  );
}

function TitleDetail() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState<number | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const progress = useProgress();
  const myList = useMyList();

  useEffect(() => {
    supabase
      .from("titles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setTitle(data));
    supabase
      .from("episodes")
      .select("*")
      .eq("title_id", id)
      .then(({ data }) => setEpisodes(sortedEpisodes(data ?? [])));
  }, [id]);

  if (!title) return <div className="h-[60vh] animate-pulse bg-white/5" />;

  const withEpisodes = { ...title, episodes };
  const vertical = title.orientation === "vertical";
  const backdrop = vertical && !title.backdrop_url ? portraitImage(withEpisodes) : landscapeImage(withEpisodes);
  const target = resumeTarget(withEpisodes, progress);
  const seasons = [...new Set(episodes.map((e) => e.season))];
  // Varsayılan sezon: devam edilecek bölümün sezonu
  const currentSeason = season ?? episodes.find((e) => e.video_uid === target?.videoUid)?.season ?? seasons[0] ?? 1;
  const seasonEpisodes = episodes.filter((e) => e.season === currentSeason);
  const restartUid = title.video_uid ?? episodes[0]?.video_uid;

  return (
    <div className="pb-16">
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdrop}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${FADE} ${vertical && !title.backdrop_url ? "scale-110 blur-2xl brightness-50" : ""}`}
          />
        )}
        {title.trailer_uid && !trailerOpen && <TrailerBackground videoUid={title.trailer_uid} className={FADE} />}
        <div className={`absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent ${FADE}`} />

        <div className="absolute bottom-10 left-4 right-4 flex items-end gap-6 sm:left-12">
          {title.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={title.poster_url}
              alt=""
              className={`hidden -rotate-2 rounded-2xl object-cover shadow-2xl shadow-accent/40 ring-4 ring-white/20 sm:block ${vertical ? "aspect-[9/16] w-40" : "aspect-[2/3] w-44"}`}
            />
          )}
          <div className="max-w-xl space-y-3">
            <h1 className="text-4xl font-black sm:text-6xl">{title.name}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span>{vertical ? "📱 Dikey dizi" : title.kind === "film" ? "🎬 Film" : "🍿 Dizi"}</span>
              {title.year && <span>· {title.year}</span>}
              {title.kind === "series" && <span>· {episodes.length} bölüm</span>}
              {(title.genres ?? []).map((g) => (
                <span key={g} className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">
                  {g}
                </span>
              ))}
            </p>
            {title.description && <p className="line-clamp-4 text-white/90">{title.description}</p>}
            <div className="flex flex-wrap gap-3 pt-1">
              {target && (
                <Link href={watchHref(target.videoUid)} className="btn inline-flex items-center gap-2 !px-7 !py-3">
                  ▶ {target.label}
                </Link>
              )}
              {target?.resumed && restartUid && (
                <Link href={watchHref(restartUid, { restart: true })} className="btn-ghost inline-flex items-center gap-2 !px-6 !py-3">
                  ↺ Baştan başla
                </Link>
              )}
              {title.trailer_uid && (
                <button onClick={() => setTrailerOpen(true)} className="btn-ghost inline-flex items-center gap-2 !px-6 !py-3">
                  🎬 Fragman
                </button>
              )}
              <MyListButton active={myList.ids.includes(title.id)} onClick={() => myList.toggle(title.id)} />
            </div>
          </div>
        </div>
      </section>

      {title.kind === "series" && (
        <section className="px-4 sm:px-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold">
              <span className="bg-brand h-6 w-1.5 rounded-full" />
              Bölümler
            </h2>
            {seasons.length > 1 && (
              <div className="flex gap-2">
                {seasons.map((s) => (
                  <button key={s} onClick={() => setSeason(s)} className={`chip ${s === currentSeason ? "chip-active" : ""}`}>
                    Sezon {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {episodes.length === 0 && <p className="text-white/60">Henüz bölüm yok.</p>}

          {vertical ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
              {seasonEpisodes.map((e) => (
                <Link key={e.id} href={watchHref(e.video_uid)} className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition hover:-translate-y-1 hover:ring-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl(e.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <span className="bg-brand absolute bottom-3 left-2 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black">{e.number}</span>
                  <ProgressBar progress={progress} videoUid={e.video_uid} />
                </Link>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {seasonEpisodes.map((e) => (
                <li key={e.id}>
                  <Link
                    href={watchHref(e.video_uid)}
                    className={`group flex items-center gap-4 rounded-2xl py-3 transition hover:bg-white/5 sm:px-4 ${e.video_uid === target?.videoUid ? "bg-white/5" : ""}`}
                  >
                    <span className="hidden w-8 text-3xl font-black text-white/30 transition group-hover:text-accent sm:block">{e.number}</span>
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl sm:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl(e.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="bg-brand absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100">
                        ▶
                      </span>
                      <ProgressBar progress={progress} videoUid={e.video_uid} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{e.name ?? `Bölüm ${e.number}`}</p>
                      {e.description && <p className="line-clamp-2 text-sm text-white/60">{e.description}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {trailerOpen && title.trailer_uid && <TrailerModal videoUid={title.trailer_uid} onClose={() => setTrailerOpen(false)} />}
    </div>
  );
}

function ProgressBar({ progress, videoUid }: { progress: WatchProgress[]; videoUid: string }) {
  const p = progress.find((x) => x.video_uid === videoUid);
  if (!p?.duration_seconds) return null;
  const percent = Math.min(100, (p.position_seconds / p.duration_seconds) * 100);
  return (
    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
      <div className="bg-brand h-full" style={{ width: `${percent}%` }} />
    </div>
  );
}
