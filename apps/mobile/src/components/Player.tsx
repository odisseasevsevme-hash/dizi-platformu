import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/lib/colors';
import { hlsUrl } from '@/lib/stream';
import { useWatchProgress } from '@/lib/useWatchProgress';

type Props = {
  videoUid: string;
  onEnded?: () => void;
  style?: ViewStyle;
  contentFit?: 'contain' | 'cover';
  // Kayıtlı konumu yok say, baştan başlat
  restart?: boolean;
  // Jenerik aralığı (saniye); bu aralıkta "Jeneriği atla" çıkar
  intro?: { start: number; end: number } | null;
  // false ise izleme kaydı tutulmaz (fragman)
  trackProgress?: boolean;
};

export function Player({ videoUid, onEnded, style, contentFit = 'contain', restart, intro, trackProgress = true }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [inIntro, setInIntro] = useState(false);
  const player = useVideoPlayer(hlsUrl(videoUid), (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  useWatchProgress(player, videoUid, { restart, enabled: trackProgress });
  useEventListener(player, 'playToEnd', () => onEnded?.());
  useEventListener(player, 'statusChange', ({ status }) => {
    setError(status === 'error' ? 'Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.' : null);
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setInIntro(!!intro && currentTime >= intro.start && currentTime < intro.end - 1);
  });

  return (
    <View style={style}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        nativeControls
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {inIntro && intro && (
        <Pressable style={styles.skip} onPress={() => player.seekBy(intro.end - player.currentTime)}>
          <Text style={styles.skipText}>Jeneriği atla ⏭</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: '#f87171', padding: 16, textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' },
  skip: {
    position: 'absolute',
    right: 16,
    bottom: 64,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  skipText: { color: '#100a26', fontWeight: '900' },
});
