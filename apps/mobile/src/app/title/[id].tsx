import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { landscapeImage, portraitImage, resumeTarget } from '@/lib/catalog';
import { colors } from '@/lib/colors';
import { thumbnailUrl } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import type { Episode, Title } from '@/lib/types';
import { useMyList } from '@/lib/useMyList';
import { useProgress } from '@/lib/useProgress';

export default function TitleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState<number | null>(null);
  const progress = useProgress();
  const myList = useMyList();

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
  const withEpisodes = { ...title, episodes };
  const backdrop = landscapeImage(withEpisodes);
  const poster = portraitImage(withEpisodes);
  const resume = resumeTarget(withEpisodes, progress);
  const restartUid = title.video_uid ?? episodes[0]?.video_uid;
  // Sezon seçilmediyse kaldığı bölümün sezonunu göster
  const shownSeason =
    season ?? episodes.find((e) => e.video_uid === resume?.videoUid)?.season ?? seasons[0] ?? 1;
  const inList = myList.ids.includes(title.id);
  const percentOf = (uid: string) => {
    const p = progress.find((x) => x.video_uid === uid);
    return p?.duration_seconds ? Math.min(100, (p.position_seconds / p.duration_seconds) * 100) : 0;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: title.name }} />
      {title.orientation === 'vertical'
        ? poster && <Image source={poster} style={styles.poster} contentFit="cover" />
        : backdrop && <Image source={backdrop} style={styles.backdrop} contentFit="cover" />}
      <Text style={styles.name}>{title.name}</Text>
      <Text style={styles.muted}>
        {title.orientation === 'vertical' ? 'Dikey dizi' : title.kind === 'film' ? 'Film' : 'Dizi'}
        {title.year ? ` · ${title.year}` : ''}
      </Text>
      {!!title.genres?.length && (
        <View style={styles.genres}>
          {title.genres.map((g) => (
            <Text key={g} style={styles.genre}>
              {g}
            </Text>
          ))}
        </View>
      )}
      {title.description && <Text style={styles.text}>{title.description}</Text>}

      {resume && (
        <Link href={{ pathname: '/watch/[uid]', params: { uid: resume.videoUid } }} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>▶ {resume.label}</Text>
          </Pressable>
        </Link>
      )}
      <View style={styles.actions}>
        {resume?.resumed && restartUid && (
          <Link href={{ pathname: '/watch/[uid]', params: { uid: restartUid, restart: '1' } }} asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>↺ Baştan başla</Text>
            </Pressable>
          </Link>
        )}
        {title.trailer_uid && (
          <Link href={{ pathname: '/watch/[uid]', params: { uid: title.trailer_uid, trailer: '1' } }} asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>🎬 Fragman</Text>
            </Pressable>
          </Link>
        )}
        <Pressable style={styles.secondary} onPress={() => myList.toggle(title.id)}>
          <Text style={styles.secondaryText}>{inList ? '✓ Listemde' : '+ Listem'}</Text>
        </Pressable>
      </View>

      {title.kind === 'series' && (
        <View style={{ gap: 12 }}>
          <Text style={styles.section}>Bölümler</Text>
          <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
            {seasons.map((s) => (
              <Pressable key={s} onPress={() => setSeason(s)} style={[styles.chip, s === shownSeason && styles.chipActive]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Sezon {s}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {episodes.length === 0 && <Text style={styles.muted}>Henüz bölüm yok.</Text>}
          {title.orientation === 'vertical' ? (
            <View style={styles.grid}>
              {episodes
                .filter((e) => e.season === shownSeason)
                .map((e) => (
                  <Link key={e.id} href={{ pathname: '/watch/[uid]', params: { uid: e.video_uid } }} asChild>
                    <Pressable style={styles.verticalEpisode}>
                      <Image source={thumbnailUrl(e.video_uid)} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <Text style={styles.episodeNumber}>{e.number}</Text>
                      <ProgressBar percent={percentOf(e.video_uid)} />
                    </Pressable>
                  </Link>
                ))}
            </View>
          ) : (
            episodes
              .filter((e) => e.season === shownSeason)
              .map((e) => (
                <Link key={e.id} href={{ pathname: '/watch/[uid]', params: { uid: e.video_uid } }} asChild>
                  <Pressable style={styles.episode}>
                    <View style={styles.thumb}>
                      <Image source={thumbnailUrl(e.video_uid)} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <ProgressBar percent={percentOf(e.video_uid)} />
                    </View>
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

function ProgressBar({ percent }: { percent: number }) {
  if (!percent) return null;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressBar, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  backdrop: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: colors.card },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondary: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryText: { color: colors.text, fontWeight: '700' },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genre: { color: colors.text, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 3, fontSize: 12, fontWeight: '700' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBar: { height: 3, backgroundColor: colors.accent },
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
  thumb: { width: 128, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.card },
});
