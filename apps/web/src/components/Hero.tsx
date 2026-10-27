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
          className={`absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(to_bottom,black_55%,transparent)] ${vertical ? "scale-110 blur-2xl brightness-50" : ""}`}
        />
      )}
      {vertical && image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute right-[8%] top-1/2 hidden h-[70%] -translate-y-1/2 rotate-2 rounded-3xl shadow-2xl shadow-accent/40 ring-4 ring-white/20 md:block" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />

      <div className="absolute bottom-[30%] left-4 right-4 max-w-xl space-y-4 sm:left-12">
        {vertical && <span className="rounded-full bg-sun px-3 py-1 text-xs font-black uppercase text-black">📱 Dikey dizi</span>}
        <h1 className="text-4xl font-black tracking-tight drop-shadow-lg sm:text-7xl">{title.name}</h1>
        {title.description && <p className="line-clamp-3 text-sm drop-shadow sm:text-lg">{title.description}</p>}
        <div className="flex gap-3">
          {video && (
            <Link href={watchHref(video)} className="btn flex items-center gap-2 !px-7 !py-3">
              ▶ Oynat
            </Link>
          )}
          <Link href={`/title/${title.id}`} className="btn-ghost flex items-center gap-2 !px-7 !py-3">
            ⓘ Detaylar
          </Link>
        </div>
      </div>
    </section>
  );
}
