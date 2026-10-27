import Link from "next/link";
import { firstVideo, landscapeImage, portraitImage, watchHref } from "@/lib/catalog";
import type { TitleWithEpisodes } from "@/lib/types";

export function Hero({ title }: { title: TitleWithEpisodes }) {
  const video = firstVideo(title);
  const vertical = title.orientation === "vertical";
  const image = vertical ? portraitImage(title) : landscapeImage(title);

  return (
    <section className="relative h-[75vh] min-h-[480px] w-full overflow-hidden">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${vertical ? "scale-110 blur-2xl brightness-50" : ""}`}
        />
      )}
      {vertical && image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute right-[8%] top-1/2 hidden h-[70%] -translate-y-1/2 rounded-lg shadow-2xl md:block" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="absolute bottom-[30%] left-4 right-4 max-w-xl space-y-4 sm:left-12">
        {vertical && <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase">Dikey dizi</span>}
        <h1 className="text-4xl font-black drop-shadow-lg sm:text-6xl">{title.name}</h1>
        {title.description && <p className="line-clamp-3 text-sm drop-shadow sm:text-lg">{title.description}</p>}
        <div className="flex gap-3">
          {video && (
            <Link href={watchHref(video)} className="flex items-center gap-2 rounded bg-white px-6 py-2 font-bold text-black hover:bg-white/80">
              ▶ Oynat
            </Link>
          )}
          <Link href={`/title/${title.id}`} className="flex items-center gap-2 rounded bg-white/30 px-6 py-2 font-bold hover:bg-white/20">
            ⓘ Detaylar
          </Link>
        </div>
      </div>
    </section>
  );
}
