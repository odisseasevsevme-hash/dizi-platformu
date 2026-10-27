import { useEventListener } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';

import { supabase } from './supabase';
import { useSession } from './useSession';

const SAVE_EVERY_SECONDS = 10;

type Options = {
  // Kayıtlı konuma atlamadan baştan başlat (yine de kaydeder)
  restart?: boolean;
  // false ise hiç okuma/yazma yapma (fragman gibi)
  enabled?: boolean;
};

// Kaldığın yerden devam: konumu yükler ve izlerken kaydeder
export function useWatchProgress(player: VideoPlayer, videoUid: string, { restart = false, enabled = true }: Options = {}) {
  const session = useSession();
  const userId = enabled ? session?.user.id : undefined;
  const lastSaved = useRef(0);

  useEffect(() => {
    if (!userId || restart) return;
    supabase
      .from('watch_progress')
      .select('position_seconds')
      .eq('video_uid', videoUid)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (!player.duration || data.position_seconds < player.duration - 30) {
          player.currentTime = data.position_seconds;
        }
      });
  }, [videoUid, userId, player, restart]);

  function save(position: number) {
    if (!userId) return;
    lastSaved.current = position;
    supabase
      .from('watch_progress')
      .upsert({
        user_id: userId,
        video_uid: videoUid,
        position_seconds: position,
        duration_seconds: player.duration || null,
        updated_at: new Date().toISOString(),
      })
      .then();
  }

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (Math.abs(currentTime - lastSaved.current) >= SAVE_EVERY_SECONDS) save(currentTime);
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying) save(player.currentTime);
  });
}
