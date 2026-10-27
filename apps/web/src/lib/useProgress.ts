"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { WatchProgress } from "./types";
import { useSession } from "./useSession";

// Kullanıcının izleme kayıtları, en son izlenenden eskiye
export function useProgress() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [progress, setProgress] = useState<WatchProgress[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("watch_progress")
      .select("video_uid, position_seconds, duration_seconds, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setProgress(data ?? []));
  }, [userId]);

  return userId ? progress : [];
}
