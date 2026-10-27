"use client";

import Link from "next/link";
import { MyListButton } from "@/components/MyListButton";
import { TrailerBackground } from "@/components/Trailer";
import { landscapeImage, portraitImage, resumeTarget, watchHref } from "@/lib/catalog";
import type { TitleWithEpisodes, WatchProgress } from "@/lib/types";

const FADE = "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]";

type Props = {
  title: TitleWithEpisodes;
  progress: WatchProgress[];
  inMyList: boolean;
  onToggleMyList: () => void;
};

export function Hero({ title, progress, inMyList, onToggleMyList }: Props) {
  const vertical = title.orientation === "vertical";
  const image = vertical ? portraitImage(title) : landscapeImage(title);
  const target = resumeTarget(title, progress);

  return (
    <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${FADE} ${vertical && !title.backdrop_url ? "scale-110 blur-2xl brightness-50" : ""}`}
        />
      )}
      {title.trailer_uid && <TrailerBackground videoUid={title.trailer_uid} className={FADE} />}
      {vertical && !title.backdrop_url && title.poster_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={title.poster_url}
          alt=""
          className="absolute right-[8%] top-1/2 hidden h-[65%] -translate-y-1/2 rotate-2 rounded-3xl shadow-2xl shadow-accent/40 ring-4 ring-white/20 md:block"
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent ${FADE}`} />

      <div className="absolute bottom-[30%] left-4 right-4 max-w-xl space-y-4 sm:left-12">
        <div className="flex flex-wrap gap-2">
          {vertical && <span className="rounded-full bg-sun px-3 py-1 text-xs font-black uppercase text-black">📱 Dikey dizi</span>}
          {(title.genres ?? []).slice(0, 3).map((g) => (
            <span key={g} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
              {g}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-black tracking-tight drop-shadow-lg sm:text-7xl">{title.name}</h1>
        {title.description && <p className="line-clamp-3 text-sm drop-shadow sm:text-lg">{title.description}</p>}
        <div className="flex flex-wrap gap-3">
          {target && (
            <Link href={watchHref(target.videoUid)} className="btn flex items-center gap-2 !px-7 !py-3">
              ▶ {target.label}
            </Link>
          )}
          <Link href={`/title/${title.id}`} className="btn-ghost flex items-center gap-2 !px-6 !py-3">
            ⓘ Detaylar
          </Link>
          <MyListButton active={inMyList} onClick={onToggleMyList} compact />
        </div>
      </div>
    </section>
  );
}
