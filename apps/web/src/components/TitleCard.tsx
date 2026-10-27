import Link from "next/link";
import { landscapeImage, portraitImage } from "@/lib/catalog";
import type { TitleWithEpisodes } from "@/lib/types";

export function TitleCard({ title, shape }: { title: TitleWithEpisodes; shape: "landscape" | "portrait" }) {
  const image = shape === "portrait" ? portraitImage(title) : landscapeImage(title);
  const size = shape === "portrait" ? "w-32 sm:w-44 aspect-[9/16]" : "w-56 sm:w-72 aspect-video";

  return (
    <Link href={`/title/${title.id}`} className={`group relative shrink-0 snap-start overflow-hidden rounded-md bg-white/5 ${size}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-sm font-semibold">{title.name}</p>
    </Link>
  );
}
