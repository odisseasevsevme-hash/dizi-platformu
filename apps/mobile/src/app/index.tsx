import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, TitleCard } from '@/components/Row';
import { BRAND_NAME, LOGO } from '@/lib/brand';
import { firstVideo, landscapeImage, portraitImage } from '@/lib/catalog';
import { colors } from '@/lib/colors';
import { thumbnailUrl } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import type { TitleWithEpisodes, WatchProgress } from '@/lib/types';
import { useSession } from '@/lib/useSession';

const HERO_HEIGHT = Dimensions.get('window').height * 0.65;

export default function Home() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [titles, setTitles] = useState<TitleWithEpisodes[] | null>(null);
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('titles')
      .select('*, episodes(video_uid, season, number)')
      .order('created_at', { ascending: false });
    setTitles(data ?? []);
    const { data: p } = await supabase
      .from('watch_progress')
      .select('video_uid, position_seconds, duration_seconds')
      .order('updated_at', { ascending: false })
      .limit(30);
    setProgress(p ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const topBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel={BRAND_NAME} />
      {session ? (
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.muted}>Çıkış</Text>
        </Pressable>
      ) : (
        <Link href="/login" style={styles.login}>
          Giriş
        </Link>
      )}
    </View>
  );

  if (!titles) return <View style={styles.screen}>{topBar}</View>;

  const playable = titles.filter((t) => firstVideo(t));
  const featured = playable.find((t) => t.featured) ?? playable[0] ?? titles[0];
  const vertical = titles.filter((t) => t.orientation === 'vertical');
  const series = titles.filter((t) => t.kind === 'series' && t.orientation === 'horizontal');
  const films = titles.filter((t) => t.kind === 'film' && t.orientation === 'horizontal');
  const continueItems = session ? continueWatching(progress, titles) : [];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, gap: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />}>
        {featured ? <Hero title={featured} /> : <View style={{ height: insets.top + 80 }} />}
        {titles.length === 0 && <Text style={[styles.muted, { padding: 16 }]}>Henüz içerik yok.</Text>}

        {continueItems.length > 0 && (
          <Row heading="İzlemeye devam et">
            {continueItems.map((item) => (
              <Link key={item.video_uid} href={{ pathname: '/watch/[uid]', params: { uid: item.video_uid } }} asChild>
                <Pressable style={styles.continueCard}>
                  <Image source={thumbnailUrl(item.video_uid)} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <Text numberOfLines={1} style={styles.continueText}>
                    {item.title.name} {item.label}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${item.percent}%` }]} />
                  </View>
                </Pressable>
              </Link>
            ))}
          </Row>
        )}
        {vertical.length > 0 && (
          <Row heading="Dikey Diziler">
            {vertical.map((t) => <TitleCard key={t.id} title={t} shape="portrait" />)}
          </Row>
        )}
        {series.length > 0 && (
          <Row heading="Diziler">
            {series.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
        {films.length > 0 && (
          <Row heading="Filmler">
            {films.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
      </ScrollView>
      {topBar}
    </View>
  );
}

function Hero({ title }: { title: TitleWithEpisodes }) {
  const video = firstVideo(title);
  const image = title.orientation === 'vertical' ? portraitImage(title) : landscapeImage(title);

  return (
    <View style={{ height: HERO_HEIGHT, justifyContent: 'flex-end' }}>
      {image && <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />}
      <View style={styles.heroShade} />
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>{title.name}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {video && (
            <Link href={{ pathname: '/watch/[uid]', params: { uid: video } }} asChild>
              <Pressable style={styles.playButton}>
                <Text style={styles.playText}>▶ Oynat</Text>
              </Pressable>
            </Link>
          )}
          <Link href={{ pathname: '/title/[id]', params: { id: title.id } }} asChild>
            <Pressable style={styles.infoButton}>
              <Text style={styles.infoText}>ⓘ Detaylar</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

function continueWatching(progress: WatchProgress[], titles: TitleWithEpisodes[]) {
  const items: (WatchProgress & { title: TitleWithEpisodes; label: string; percent: number })[] = [];
  const seen = new Set<string>();
  for (const p of progress) {
    if (p.duration_seconds && p.position_seconds > p.duration_seconds - 30) continue;
    for (const title of titles) {
      const episode = title.episodes.find((e) => e.video_uid === p.video_uid);
      if (title.video_uid !== p.video_uid && !episode) continue;
      if (seen.has(title.id)) break;
      seen.add(title.id);
      const percent = p.duration_seconds ? (p.position_seconds / p.duration_seconds) * 100 : 0;
      items.push({ ...p, title, percent, label: episode ? `S${episode.season}:B${episode.number}` : '' });
      break;
    }
  }
  return items;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { width: 110, height: 24 },
  login: { color: '#fff', backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, fontWeight: '600' },
  muted: { color: colors.muted },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroContent: { padding: 16, gap: 14, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  playButton: { backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 22, paddingVertical: 10 },
  playText: { color: '#000', fontWeight: '700' },
  infoButton: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, paddingHorizontal: 22, paddingVertical: 10 },
  infoText: { color: '#fff', fontWeight: '700' },
  continueCard: { width: 220, aspectRatio: 16 / 9, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.card, justifyContent: 'flex-end' },
  continueText: { color: '#fff', fontWeight: '600', fontSize: 13, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBar: { height: 3, backgroundColor: colors.accent },
});
