import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/colors';
import { posterFor, thumbnailUrl } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import type { Episode, Title } from '@/lib/types';

export default function TitleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState(1);

  useEffect(() => {
    supabase
      .from('titles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setTitle(data));
    supabase
      .from('episodes')
      .select('*')
      .eq('title_id', id)
      .order('season')
      .order('number')
      .then(({ data }) => setEpisodes(data ?? []));
  }, [id]);

  if (!title) return <Text style={styles.muted}>Yükleniyor…</Text>;

  const seasons = [...new Set(episodes.map((e) => e.season))];
  const poster = posterFor(title);
  const play = title.video_uid ?? episodes[0]?.video_uid;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: title.name }} />
      {poster && <Image source={poster} style={styles.poster} contentFit="cover" />}
      <Text style={styles.name}>{title.name}</Text>
      <Text style={styles.muted}>
        {title.orientation === 'vertical' ? 'Dikey dizi' : title.kind === 'film' ? 'Film' : 'Dizi'}
        {title.year ? ` · ${title.year}` : ''}
      </Text>
      {title.description && <Text style={styles.text}>{title.description}</Text>}

      {play && (
        <Link href={{ pathname: '/watch/[uid]', params: { uid: play } }} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>▶ {title.kind === 'film' ? 'Oynat' : '1. bölümden başla'}</Text>
          </Pressable>
        </Link>
      )}

      {title.kind === 'series' && (
        <View style={{ gap: 12 }}>
          <Text style={styles.section}>Bölümler</Text>
          <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
            {seasons.map((s) => (
              <Pressable key={s} onPress={() => setSeason(s)} style={[styles.chip, s === season && styles.chipActive]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Sezon {s}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {episodes.length === 0 && <Text style={styles.muted}>Henüz bölüm yok.</Text>}
          {title.orientation === 'vertical' ? (
            <View style={styles.grid}>
              {episodes
                .filter((e) => e.season === season)
                .map((e) => (
                  <Link key={e.id} href={{ pathname: '/watch/[uid]', params: { uid: e.video_uid } }} asChild>
                    <Pressable style={styles.verticalEpisode}>
                      <Image source={thumbnailUrl(e.video_uid)} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <Text style={styles.episodeNumber}>{e.number}</Text>
                    </Pressable>
                  </Link>
                ))}
            </View>
          ) : (
            episodes
              .filter((e) => e.season === season)
              .map((e) => (
                <Link key={e.id} href={{ pathname: '/watch/[uid]', params: { uid: e.video_uid } }} asChild>
                  <Pressable style={styles.episode}>
                    <Image source={thumbnailUrl(e.video_uid)} style={styles.thumb} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.text}>
                        {e.number}. {e.name ?? `Bölüm ${e.number}`}
                      </Text>
                      {e.description && (
                        <Text numberOfLines={2} style={styles.muted}>
                          {e.description}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Link>
              ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  poster: { width: 160, height: 240, borderRadius: 6, alignSelf: 'center' },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  verticalEpisode: {
    width: (Dimensions.get('window').width - 32 - 12) / 3,
    aspectRatio: 9 / 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.card,
    justifyContent: 'flex-end',
  },
  episodeNumber: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    margin: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  name: { color: colors.text, fontSize: 24, fontWeight: '700' },
  text: { color: colors.text },
  muted: { color: colors.muted },
  button: { backgroundColor: colors.accent, borderRadius: 999, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent },
  episode: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 128, height: 72, borderRadius: 10, backgroundColor: colors.card },
});
