import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { hlsUrl } from '@/lib/stream';
import { useWatchProgress } from '@/lib/useWatchProgress';

type Props = {
  videoUid: string;
  onEnded?: () => void;
  style?: ViewStyle;
  contentFit?: 'contain' | 'cover';
};

export function Player({ videoUid, onEnded, style, contentFit = 'contain' }: Props) {
  const [error, setError] = useState<string | null>(null);
  const player = useVideoPlayer(hlsUrl(videoUid), (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  useWatchProgress(player, videoUid);
  useEventListener(player, 'playToEnd', () => onEnded?.());
  useEventListener(player, 'statusChange', ({ status }) => {
    setError(status === 'error' ? 'Video henüz hazır değil ya da yüklenemedi. Biraz sonra tekrar dene.' : null);
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
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: '#f87171', padding: 16, textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' },
});
