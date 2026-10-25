"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { posterFor, thumbnailUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import type { Episode, Title } from "@/lib/types";

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
  const [season, setSeason] = useState(1);

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
      .order("season")
      .order("number")
      .then(({ data }) => setEpisodes(data ?? []));
  }, [id]);

  if (!title) return <p className="opacity-60">Yükleniyor…</p>;

  const seasons = [...new Set(episodes.map((e) => e.season))];
  const poster = posterFor(title);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-6 sm:flex-row">
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={title.name} className="w-48 self-start rounded-md" />
        )}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{title.name}</h1>
          <p className="text-sm opacity-60">
            {title.kind === "film" ? "Film" : "Dizi"}
            {title.year ? ` · ${title.year}` : ""}
          </p>
          {title.description && <p className="max-w-prose opacity-80">{title.description}</p>}
          {title.video_uid && (
            <Link href={`/watch/${title.video_uid}?t=${encodeURIComponent(title.name)}`} className="btn inline-block">
              ▶ İzle
            </Link>
          )}
        </div>
      </div>

      {title.kind === "series" && (
        <section className="mt-10">
          <div className="mb-4 flex gap-2">
            {seasons.map((s) => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`rounded-full px-3 py-1 text-sm ${s === season ? "bg-white text-black" : "bg-white/10"}`}
              >
                Sezon {s}
              </button>
            ))}
          </div>
          {episodes.length === 0 && <p className="opacity-60">Henüz bölüm yok.</p>}
          <ul className="space-y-3">
            {episodes
              .filter((e) => e.season === season)
              .map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/watch/${e.video_uid}?t=${encodeURIComponent(`${title.name} S${e.season} B${e.number}`)}`}
                    className="flex gap-4 rounded-md p-2 hover:bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailUrl(e.video_uid)} alt="" className="aspect-video w-40 rounded object-cover" />
                    <div>
                      <p className="font-medium">
                        {e.number}. {e.name ?? `Bölüm ${e.number}`}
                      </p>
                      {e.description && <p className="text-sm opacity-60">{e.description}</p>}
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
