import Link from "next/link";
import { landscapeImage, portraitImage } from "@/lib/catalog";
import type { TitleWithEpisodes } from "@/lib/types";

export function TitleCard({ title, shape }: { title: TitleWithEpisodes; shape: "landscape" | "portrait" }) {
  const image = shape === "portrait" ? portraitImage(title) : landscapeImage(title);
  const size = shape === "portrait" ? "w-32 sm:w-44 aspect-[9/16]" : "w-56 sm:w-72 aspect-video";

  return (
    <Link href={`/title/${title.id}`} className={`group relative shrink-0 snap-start overflow-hidden rounded-2xl bg-surface ring-2 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/30 hover:ring-accent ${size}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-black/10 to-transparent" />
      <p className="absolute inset-x-3 bottom-3 line-clamp-2 text-sm font-bold">{title.name}</p>
    </Link>
  );
}
