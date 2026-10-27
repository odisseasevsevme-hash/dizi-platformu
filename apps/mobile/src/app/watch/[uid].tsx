import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, type ListViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Player } from '@/components/Player';
import { thumbnailUrl } from '@/lib/stream';
import type { Episode } from '@/lib/types';
import { loadWatchContext, type WatchContext } from '@/lib/watchContext';

export default function WatchScreen() {
  const { uid, restart, trailer } = useLocalSearchParams<{ uid: string; restart?: string; trailer?: string }>();
  const [context, setContext] = useState<WatchContext | null | undefined>(undefined);

  useEffect(() => {
    if (!trailer) loadWatchContext(uid).then(setContext);
  }, [uid, trailer]);

  // Fragman: izleme kaydı tutmadan, tek başına oynat
  if (trailer) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <BackButton />
        <Player videoUid={uid} trackProgress={false} style={styles.horizontalVideo} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      {context === undefined ? null : context?.title.orientation === 'vertical' ? (
        <VerticalFeed context={context} startUid={uid} restart={!!restart} />
      ) : (
        <HorizontalPlayer uid={uid} context={context} restart={!!restart} />
      )}
    </View>
  );
}

function BackButton() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={12}>
      <Text style={styles.backText}>←</Text>
    </Pressable>
  );
}

function introOf(episode?: Pick<Episode, 'intro_start_seconds' | 'intro_end_seconds'> | null) {
  if (episode?.intro_end_seconds == null) return null;
  return { start: episode.intro_start_seconds ?? 0, end: episode.intro_end_seconds };
}

function HorizontalPlayer({ uid, context, restart }: { uid: string; context: WatchContext | null; restart: boolean }) {
  const index = context?.episodes.findIndex((e) => e.video_uid === uid) ?? -1;
  const current = index >= 0 ? context!.episodes[index] : null;
  const next = index >= 0 ? context!.episodes[index + 1] : undefined;
  const goNext = () => next && router.replace({ pathname: '/watch/[uid]', params: { uid: next.video_uid } });

  return (
    <View style={styles.center}>
      <BackButton />
      <Player
        key={uid}
        videoUid={uid}
        onEnded={goNext}
        restart={restart}
        intro={introOf(current)}
        style={styles.horizontalVideo}
      />
      <View style={styles.info}>
        <Text style={styles.title}>{context?.title.name}</Text>
        {current && (
          <Text style={styles.subtitle}>
            S{current.season}:B{current.number} {current.name ?? ''}
          </Text>
        )}
        {next && (
          <Pressable onPress={goNext} style={styles.nextButton}>
            <Text style={styles.nextText}>Sonraki bölüm ▸</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Kısa video uygulamaları gibi: yukarı kaydırınca sonraki bölüm, bitince kendiliğinden geçer
function VerticalFeed({ context, startUid, restart }: { context: WatchContext; startUid: string; restart: boolean }) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const episodes: Pick<Episode, 'video_uid' | 'number' | 'intro_start_seconds' | 'intro_end_seconds'>[] =
    context.episodes.length
      ? context.episodes
      : [{ video_uid: startUid, number: 1, intro_start_seconds: null, intro_end_seconds: null }];
  const startIndex = Math.max(0, episodes.findIndex((e) => e.video_uid === startUid));
  const [active, setActive] = useState(startIndex);
  const list = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const visible = viewableItems[0];
    if (visible?.index != null) setActive(visible.index);
  }, []);

  const goTo = (index: number) => {
    if (index < episodes.length) list.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <>
      <FlatList
        ref={list}
        data={episodes}
        keyExtractor={(e) => e.video_uid}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        windowSize={3}
        renderItem={({ item, index }) => (
          <View style={{ height, width }}>
            {index === active ? (
              <Player
                videoUid={item.video_uid}
                onEnded={() => goTo(index + 1)}
                restart={restart && item.video_uid === startUid}
                intro={introOf(item)}
                style={{ flex: 1 }}
                contentFit="cover"
              />
            ) : (
              <Image source={thumbnailUrl(item.video_uid)} style={{ flex: 1 }} contentFit="cover" />
            )}
            <View style={[styles.overlay, { bottom: insets.bottom + 72 }]} pointerEvents="none">
              <Text style={styles.title}>{context.title.name}</Text>
              <Text style={styles.subtitle}>
                Bölüm {item.number} / {episodes.length}
              </Text>
            </View>
          </View>
        )}
      />
      <BackButton />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center' },
  horizontalVideo: { width: '100%', aspectRatio: 16 / 9 },
  info: { padding: 16, gap: 6 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)' },
  nextButton: { alignSelf: 'flex-start', backgroundColor: '#ec0166', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  nextText: { color: '#fff', fontWeight: '800' },
  back: { position: 'absolute', left: 16, zIndex: 10 },
  backText: { color: '#fff', fontSize: 30 },
  overlay: { position: 'absolute', left: 16, right: 16 },
});
