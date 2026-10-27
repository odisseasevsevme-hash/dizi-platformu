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
            className={`absolute inset-0 h-full w-full object-cover ${vertical ? "scale-110 blur-2xl brightness-50" : ""}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-10 left-4 right-4 flex items-end gap-6 sm:left-12">
          {vertical && backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop} alt="" className="hidden aspect-[9/16] w-40 rounded-md object-cover shadow-2xl sm:block" />
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
              <Link href={watchHref(play)} className="inline-flex items-center gap-2 rounded bg-white px-6 py-2 font-bold text-black hover:bg-white/80">
                ▶ {title.kind === "film" ? "Oynat" : "1. bölümden başla"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {title.kind === "series" && (
        <section className="px-4 sm:px-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bölümler</h2>
            {seasons.length > 1 && (
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="rounded border border-white/30 bg-black px-3 py-1"
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
                <Link key={e.id} href={watchHref(e.video_uid)} className="group relative aspect-[9/16] overflow-hidden rounded-md bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl(e.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-lg font-bold">{e.number}</span>
                </Link>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {seasonEpisodes.map((e) => (
                <li key={e.id}>
                  <Link href={watchHref(e.video_uid)} className="group flex items-center gap-4 py-4 hover:bg-white/5 sm:px-4">
                    <span className="hidden w-6 text-2xl text-white/50 sm:block">{e.number}</span>
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded sm:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl(e.video_uid)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full border border-white bg-black/50 opacity-0 transition group-hover:opacity-100">
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
