import { useEventListener } from 'expo';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { hlsUrl } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/useSession';

const SAVE_EVERY_SECONDS = 10;

export default function WatchScreen() {
  const { uid, t } = useLocalSearchParams<{ uid: string; t?: string }>();
  const session = useSession();
  const userId = session?.user.id;
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(0);

  const player = useVideoPlayer(hlsUrl(uid), (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  // Kaldığın yerden devam et
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('watch_progress')
      .select('position_seconds')
      .eq('video_uid', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (!player.duration || data.position_seconds < player.duration - 30) {
          player.currentTime = data.position_seconds;
        }
      });
  }, [uid, userId, player]);

  function save(position: number) {
    if (!userId) return;
    lastSaved.current = position;
    supabase
      .from('watch_progress')
      .upsert({
        user_id: userId,
        video_uid: uid,
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
  useEventListener(player, 'statusChange', ({ status }) => {
    setError(status === 'error' ? 'Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.' : null);
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t ?? '' }} />
      <VideoView player={player} style={styles.video} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  error: { color: '#f87171', padding: 16, textAlign: 'center' },
});
