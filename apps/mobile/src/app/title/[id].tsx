import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: title.name }} />
      {poster && <Image source={poster} style={styles.poster} contentFit="cover" />}
      <Text style={styles.name}>{title.name}</Text>
      <Text style={styles.muted}>
        {title.kind === 'film' ? 'Film' : 'Dizi'}
        {title.year ? ` · ${title.year}` : ''}
      </Text>
      {title.description && <Text style={styles.text}>{title.description}</Text>}

      {title.video_uid && (
        <Link href={{ pathname: '/watch/[uid]', params: { uid: title.video_uid, t: title.name } }} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>▶ İzle</Text>
          </Pressable>
        </Link>
      )}

      {title.kind === 'series' && (
        <View style={{ gap: 12 }}>
          <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
            {seasons.map((s) => (
              <Pressable key={s} onPress={() => setSeason(s)} style={[styles.chip, s === season && styles.chipActive]}>
                <Text style={{ color: s === season ? '#000' : colors.text }}>Sezon {s}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {episodes.length === 0 && <Text style={styles.muted}>Henüz bölüm yok.</Text>}
          {episodes
            .filter((e) => e.season === season)
            .map((e) => (
              <Link
                key={e.id}
                href={{
                  pathname: '/watch/[uid]',
                  params: { uid: e.video_uid, t: `${title.name} S${e.season} B${e.number}` },
                }}
                asChild>
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
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  poster: { width: 160, height: 240, borderRadius: 6, alignSelf: 'center' },
  name: { color: colors.text, fontSize: 24, fontWeight: '700' },
  text: { color: colors.text },
  muted: { color: colors.muted },
  button: { backgroundColor: colors.accent, borderRadius: 6, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.card },
  chipActive: { backgroundColor: '#fff' },
  episode: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 128, height: 72, borderRadius: 4, backgroundColor: colors.card },
});
