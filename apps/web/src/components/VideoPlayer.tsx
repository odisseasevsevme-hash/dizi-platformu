"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { hlsUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

const SAVE_EVERY_SECONDS = 10;

type Props = {
  videoUid: string;
  onEnded?: () => void;
  className?: string;
};

export function VideoPlayer({ videoUid, onEnded, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { session } = useSession();
  const userId = session?.user.id;
  const [error, setError] = useState<string | null>(null);

  // Videoyu yükle
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const src = hlsUrl(videoUid);

    // Safari ve iOS doğrudan HLS oynatır
    if (video.canPlayType("application/vnd.apple.mpegurl") || !Hls.isSupported()) {
      video.src = src;
      return;
    }
    const hls = new Hls();
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) setError("Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.");
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [videoUid]);

  // Kaldığın yerden devam et
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !userId) return;

    supabase
      .from("watch_progress")
      .select("position_seconds")
      .eq("video_uid", videoUid)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const resume = () => {
          // Sona çok yakınsa baştan başlat
          if (!video.duration || data.position_seconds < video.duration - 30) {
            video.currentTime = data.position_seconds;
          }
        };
        if (video.readyState >= 1) resume();
        else video.addEventListener("loadedmetadata", resume, { once: true });
      });

    let lastSaved = 0;
    const save = () => {
      if (Math.abs(video.currentTime - lastSaved) < SAVE_EVERY_SECONDS && !video.paused) return;
      lastSaved = video.currentTime;
      supabase.from("watch_progress").upsert({
        user_id: userId,
        video_uid: videoUid,
        position_seconds: video.currentTime,
        duration_seconds: Number.isFinite(video.duration) ? video.duration : null,
        updated_at: new Date().toISOString(),
      }).then();
    };
    video.addEventListener("timeupdate", save);
    video.addEventListener("pause", save);
    return () => {
      video.removeEventListener("timeupdate", save);
      video.removeEventListener("pause", save);
    };
  }, [videoUid, userId]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        onEnded={onEnded}
        className="h-full w-full bg-black object-contain"
        onError={() => setError("Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.")}
      />
      {error && (
        <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
