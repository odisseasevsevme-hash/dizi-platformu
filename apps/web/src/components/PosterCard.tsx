import Link from "next/link";
import { posterFor } from "@/lib/stream";
import type { Title } from "@/lib/types";

export function PosterCard({ title }: { title: Title }) {
  const poster = posterFor(title);
  return (
    <Link href={`/title/${title.id}`} className="group block">
      <div className="aspect-[2/3] overflow-hidden rounded-md bg-white/5">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={title.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center opacity-60">
            {title.name}
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm">{title.name}</p>
    </Link>
  );
}
