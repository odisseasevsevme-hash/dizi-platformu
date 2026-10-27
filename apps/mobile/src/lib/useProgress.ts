import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { supabase } from './supabase';
import type { WatchProgress } from './types';
import { useSession } from './useSession';

// Kullanıcının izleme kayıtları, en yeniden eskiye; ekrana her dönüldüğünde yenilenir
export function useProgress() {
  const userId = useSession()?.user.id;
  const [progress, setProgress] = useState<WatchProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      supabase
        .from('watch_progress')
        .select('video_uid, position_seconds, duration_seconds, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500)
        .then(({ data }) => setProgress(data ?? []));
    }, [userId]),
  );

  return userId ? progress : [];
}
