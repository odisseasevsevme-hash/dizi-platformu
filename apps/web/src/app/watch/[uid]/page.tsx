"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { VerticalFeed } from "@/components/VerticalFeed";
import { VideoPlayer } from "@/components/VideoPlayer";
import { watchHref } from "@/lib/catalog";
import { loadWatchContext, type WatchContext } from "@/lib/watchContext";

export default function WatchPage() {
  return (
    <Suspense>
      <Watch />
    </Suspense>
  );
}

function Watch() {
  const { uid } = useParams<{ uid: string }>();
  const restart = useSearchParams().get("restart") === "1";
  const [context, setContext] = useState<WatchContext | null | undefined>(undefined);

  useEffect(() => {
    loadWatchContext(uid).then(setContext);
  }, [uid]);

  if (context === undefined) return <div className="fixed inset-0 bg-black" />;
  if (context?.title.orientation === "vertical") return <VerticalFeed context={context} startUid={uid} />;
  return <HorizontalPlayer uid={uid} context={context} restart={restart} />;
}

function HorizontalPlayer({ uid, context, restart }: { uid: string; context: WatchContext | null; restart: boolean }) {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  const index = context?.episodes.findIndex((e) => e.video_uid === uid) ?? -1;
  const current = index >= 0 ? context!.episodes[index] : null;
  const next = index >= 0 ? context!.episodes[index + 1] : undefined;
  const back = context ? `/title/${context.title.id}` : "/";

  // Bölüm bitince 5 saniye sonra sıradakine geç
  useEffect(() => {
    if (!ended || !next) return;
    const timer = setTimeout(() => router.replace(watchHref(next.video_uid)), 5000);
    return () => clearTimeout(timer);
  }, [ended, next, router]);

  return (
    <div className="group fixed inset-0 bg-black">
      <VideoPlayer
        key={uid}
        videoUid={uid}
        restart={restart}
        intro={current ? { start: current.intro_start_seconds, end: current.intro_end_seconds } : undefined}
        onEnded={() => setEnded(true)}
        className="h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
        <Link href={back} className="pointer-events-auto text-3xl" aria-label="Geri">
          ←
        </Link>
        <p className="font-semibold">
          {context?.title.name}
          {current && <span className="ml-2 font-normal text-white/70">S{current.season}:B{current.number} {current.name ?? ""}</span>}
        </p>
      </div>

      {next && (
        <Link
          href={watchHref(next.video_uid)}
          replace
          className={`btn absolute bottom-20 right-6 ${
            ended ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {ended ? "Sonraki bölüm başlıyor… ▸" : "Sonraki bölüm ▸"}
        </Link>
      )}
    </div>
  );
}
