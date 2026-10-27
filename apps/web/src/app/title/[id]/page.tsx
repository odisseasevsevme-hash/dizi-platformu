"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { landscapeImage, portraitImage, watchHref } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import type { Episode, TitleWithEpisodes } from "@/lib/types";

export default function TitlePage() {
  return (
    <Suspense>
      <TitleDetail />
    </Suspense>
  );
}

function TitleDetail() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<TitleWithEpisodes | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState(1);

  useEffect(() => {
    supabase
      .from("titles")
      .select("*, episodes(video_uid, season, number)")
      .eq("id", id)
      .single()
      .then(({ data }) => setTitle(data));
    supabase
      .from("episodes")
      .select("*")
      .eq("title_id", id)
      .order("season")
      .order("number")
      .then(({ data }) => setEpisodes(data ?? []));
  }, [id]);

  if (!title) return <div className="h-[60vh] animate-pulse bg-white/5" />;

  const vertical = title.orientation === "vertical";
  const seasons = [...new Set(episodes.map((e) => e.season))];
  const backdrop = vertical ? portraitImage(title) : landscapeImage(title);
  const play = title.video_uid ?? episodes[0]?.video_uid;
  const seasonEpisodes = episodes.filter((e) => e.season === season);

  return (
    <div className="pb-16">
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdrop}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(to_bottom,black_55%,transparent)] ${vertical ? "scale-110 blur-2xl brightness-50" : ""}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
          <div className="absolute bottom-10 left-4 right-4 flex items-end gap-6 sm:left-12">
          {vertical && backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop} alt="" className="hidden aspect-[9/16] w-40 -rotate-2 rounded-2xl object-cover shadow-2xl shadow-accent/40 ring-4 ring-white/20 sm:block" />
          )}
          <div className="max-w-xl space-y-3">
            <h1 className="text-4xl font-black sm:text-5xl">{title.name}</h1>
            <p className="text-sm text-white/70">
              {vertical ? "Dikey dizi" : title.kind === "film" ? "Film" : "Dizi"}
              {title.year ? ` · ${title.year}` : ""}
              {title.kind === "series" ? ` · ${episodes.length} bölüm` : ""}
            </p>
            {title.description && <p className="line-clamp-4 text-white/90">{title.description}</p>}
            {play && (
              <Link href={watchHref(play)} className="btn inline-flex items-center gap-2 !px-7 !py-3">
                ▶ {title.kind === "film" ? "Oynat" : "1. bölümden başla"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {title.kind === "series" && (
        <section className="px-4 sm:px-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold"><span className="bg-brand h-6 w-1.5 rounded-full" />Bölümler</h2>
            {seasons.length > 1 && (
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="rounded-full border border-white/20 bg-surface px-4 py-1 font-semibold"
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    Sezon {s}
                  </option>
                ))}
              </select>
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
                  <span className="bg-brand absolute bottom-2 left-2 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black">{e.number}</span>
                </Link>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {seasonEpisodes.map((e) => (
                <li key={e.id}>
                  <Link href={watchHref(e.video_uid)} className="group flex items-center gap-4 rounded-2xl py-3 transition hover:bg-white/5 sm:px-4">
                    <span className="hidden w-8 text-3xl font-black text-white/30 transition group-hover:text-accent sm:block">{e.number}</span>
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl sm:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl(e.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center bg-brand rounded-full opacity-0 transition group-hover:opacity-100">
                        ▶
                      </span>
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
    </div>
  );
}
