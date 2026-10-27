"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { hlsUrl } from "@/lib/stream";

// Afişin arkasında sessiz, döngüde oynayan fragman (Netflix'teki gibi)
export function TrailerBackground({ videoUid, className = "" }: { videoUid: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    // Sayfa açılır açılmaz değil, kısa bir bekleyişten sonra başlasın
    const timer = setTimeout(() => {
      const src = hlsUrl(videoUid);
      if (video.canPlayType("application/vnd.apple.mpegurl") || !Hls.isSupported()) {
        video.src = src;
      } else {
        hls = new Hls({ abrEwmaDefaultEstimate: 8_000_000, capLevelToPlayerSize: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      }
      video.play().catch(() => {});
    }, 1500);
    return () => {
      clearTimeout(timer);
      hls?.destroy();
    };
  }, [videoUid]);

  return (
    <>
      <video
        ref={videoRef}
        muted={muted}
        loop
        playsInline
        onPlaying={() => setVisible(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      />
      {visible && (
        <button
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Sesi aç" : "Sesi kapat"}
          className="absolute bottom-[32%] right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-black/30 text-lg backdrop-blur transition hover:scale-110 sm:right-12"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}
    </>
  );
}

// Tam ekran fragman penceresi
export function TrailerModal({ videoUid, onClose }: { videoUid: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative aspect-video w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <VideoPlayer videoUid={videoUid} trackProgress={false} onEnded={onClose} className="h-full w-full overflow-hidden rounded-2xl" />
        <button onClick={onClose} aria-label="Kapat" className="absolute -top-12 right-0 text-3xl">
          ✕
        </button>
      </div>
    </div>
  );
}
