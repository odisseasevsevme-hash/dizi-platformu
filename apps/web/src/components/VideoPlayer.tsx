"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { hlsUrl } from "@/lib/stream";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

const SAVE_EVERY_SECONDS = 10;
const SUBTITLE_KEY = "subtitleLang";

type Props = {
  videoUid: string;
  onEnded?: () => void;
  className?: string;
  // Baştan başla: kayıtlı konumu yok say
  restart?: boolean;
  intro?: { start: number | null; end: number | null };
  // Fragmanlarda izleme konumu kaydedilmez
  trackProgress?: boolean;
};

type Level = { index: number; height: number };
type Caption = { srclang: string; label: string };

export function VideoPlayer({ videoUid, onEnded, className = "", restart = false, intro, trackProgress = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { session } = useSession();
  const userId = session?.user.id;
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevel] = useState(-1); // -1: otomatik
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [subtitle, setSubtitle] = useState<string>("");
  const [menu, setMenu] = useState<"quality" | "subtitles" | null>(null);
  const [inIntro, setInIntro] = useState(false);

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
    const hls = new Hls({
      // Bağlantı hızını iyimser tahmin et ki yüksek kaliteden başlasın
      abrEwmaDefaultEstimate: 8_000_000,
      capLevelToPlayerSize: false,
    });
    hlsRef.current = hls;
    hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
      setLevels(
        data.levels
          .map((l, index) => ({ index, height: l.height }))
          .sort((a, b) => b.height - a.height),
      );
    });
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) setError("Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.");
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [videoUid]);

  // Altyazı dilleri
  useEffect(() => {
    fetch(`/api/captions/${videoUid}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Caption[]) => {
        setCaptions(list);
        let saved = "";
        try {
          saved = localStorage.getItem(SUBTITLE_KEY) ?? "";
        } catch {}
        if (list.some((c) => c.srclang === saved)) setSubtitle(saved);
      })
      .catch(() => setCaptions([]));
  }, [videoUid]);

  // Seçilen altyazıyı göster
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    for (const track of Array.from(video.textTracks)) {
      track.mode = track.language === subtitle ? "showing" : "disabled";
    }
  }, [subtitle, captions]);

  // Kaldığın yerden devam et
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !userId || !trackProgress) return;

    if (!restart) {
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
    }

    let lastSaved = 0;
    const save = () => {
      if (Math.abs(video.currentTime - lastSaved) < SAVE_EVERY_SECONDS && !video.paused) return;
      lastSaved = video.currentTime;
      supabase
        .from("watch_progress")
        .upsert({
          user_id: userId,
          video_uid: videoUid,
          position_seconds: video.currentTime,
          duration_seconds: Number.isFinite(video.duration) ? video.duration : null,
          updated_at: new Date().toISOString(),
        })
        .then();
    };
    video.addEventListener("timeupdate", save);
    video.addEventListener("pause", save);
    return () => {
      video.removeEventListener("timeupdate", save);
      video.removeEventListener("pause", save);
    };
  }, [videoUid, userId, restart, trackProgress]);

  // Jeneriği atla butonu
  useEffect(() => {
    const video = videoRef.current;
    const start = intro?.start ?? null;
    const end = intro?.end ?? null;
    if (!video || end == null) return;
    const check = () => setInIntro(video.currentTime >= (start ?? 0) && video.currentTime < end - 1);
    video.addEventListener("timeupdate", check);
    return () => video.removeEventListener("timeupdate", check);
  }, [intro?.start, intro?.end]);

  // Seçilen kaliteyi uygula (-1: bağlantıya göre otomatik)
  useEffect(() => {
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  }, [level]);

  function chooseLevel(index: number) {
    setLevel(index);
    setMenu(null);
  }

  function chooseSubtitle(lang: string) {
    setSubtitle(lang);
    try {
      localStorage.setItem(SUBTITLE_KEY, lang);
    } catch {}
    setMenu(null);
  }

  return (
    <div className={`group/player relative ${className}`}>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        onEnded={onEnded}
        className="h-full w-full bg-black object-contain"
        onError={() => setError("Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.")}
      >
        {captions.map((c) => (
          <track key={c.srclang} kind="subtitles" srcLang={c.srclang} label={c.label} src={`/api/captions/${videoUid}/${c.srclang}`} />
        ))}
      </video>

      {error && (
        <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-sm text-red-400">{error}</p>
      )}

      {inIntro && (
        <button
          onClick={() => {
            if (videoRef.current && intro?.end != null) videoRef.current.currentTime = intro.end;
          }}
          className="btn-ghost absolute bottom-24 right-6 border border-white/40 !bg-black/60"
        >
          Jeneriği atla ⏭
        </button>
      )}

      {(levels.length > 1 || captions.length > 0) && (
        <div className="absolute right-4 top-16 flex gap-2 opacity-0 transition group-hover/player:opacity-100 sm:top-4">
          {captions.length > 0 && (
            <button onClick={() => setMenu(menu === "subtitles" ? null : "subtitles")} className="chip !bg-black/60">
              💬 {captions.find((c) => c.srclang === subtitle)?.label ?? "Altyazı"}
            </button>
          )}
          {levels.length > 1 && (
            <button onClick={() => setMenu(menu === "quality" ? null : "quality")} className="chip !bg-black/60">
              ⚙ {level === -1 ? "Otomatik" : `${levels.find((l) => l.index === level)?.height}p`}
            </button>
          )}
        </div>
      )}

      {menu && (
        <div className="absolute right-4 top-28 z-10 min-w-40 overflow-hidden rounded-2xl bg-surface/95 py-2 shadow-2xl backdrop-blur sm:top-16">
          {menu === "quality" &&
            [{ index: -1, height: 0 }, ...levels].map((l) => (
              <MenuItem key={l.index} active={level === l.index} onClick={() => chooseLevel(l.index)}>
                {l.index === -1 ? "Otomatik" : `${l.height}p${l.height >= 1080 ? " HD" : ""}`}
              </MenuItem>
            ))}
          {menu === "subtitles" &&
            [{ srclang: "", label: "Kapalı" }, ...captions].map((c) => (
              <MenuItem key={c.srclang} active={subtitle === c.srclang} onClick={() => chooseSubtitle(c.srclang)}>
                {c.label}
              </MenuItem>
            ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${active ? "font-bold text-accent" : ""}`}>
      {active ? "✓ " : ""}
      {children}
    </button>
  );
}
