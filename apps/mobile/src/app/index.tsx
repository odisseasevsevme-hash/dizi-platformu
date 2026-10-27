import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, TitleCard } from '@/components/Row';
import { BRAND_NAME, LOGO } from '@/lib/brand';
import { firstVideo, landscapeImage, portraitImage, resumeTarget } from '@/lib/catalog';
import { colors } from '@/lib/colors';
import { thumbnailUrl } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import type { TitleWithEpisodes, WatchProgress } from '@/lib/types';
import { useMyList } from '@/lib/useMyList';
import { useProgress } from '@/lib/useProgress';
import { useSession } from '@/lib/useSession';

const HERO_HEIGHT = Dimensions.get('window').height * 0.65;

export default function Home() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [titles, setTitles] = useState<TitleWithEpisodes[] | null>(null);
  const progress = useProgress();
  const myList = useMyList();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('titles')
      .select('*, episodes(video_uid, season, number)')
      .order('created_at', { ascending: false });
    setTitles(data ?? []);
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
      <View style={{ flex: 1 }} />
      <Link href="/search" style={styles.search} accessibilityLabel="Ara">
        🔍
      </Link>
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
  const listed = myList.ids.map((id) => titles.find((t) => t.id === id)).filter((t) => t !== undefined);
  const genres = [...new Set(titles.flatMap((t) => t.genres ?? []))].sort((a, b) => a.localeCompare(b, 'tr'));
  const card = (t: TitleWithEpisodes) => (
    <TitleCard key={t.id} title={t} shape={t.orientation === 'vertical' ? 'portrait' : 'landscape'} />
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, gap: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />}>
        {featured ? (
          <Hero
            title={featured}
            progress={progress}
            inMyList={myList.ids.includes(featured.id)}
            onToggleMyList={() => myList.toggle(featured.id)}
          />
        ) : (
          <View style={{ height: insets.top + 80 }} />
        )}
        {titles.length === 0 && <Text style={[styles.muted, { padding: 16 }]}>Henüz içerik yok.</Text>}

        {continueItems.length > 0 && (
          <Row heading="▶️ İzlemeye devam et">
            {continueItems.map((item) => (
              <Link key={item.title.id} href={{ pathname: '/watch/[uid]', params: { uid: item.videoUid } }} asChild>
                <Pressable style={styles.continueCard}>
                  <Image source={thumbnailUrl(item.videoUid)} style={StyleSheet.absoluteFill} contentFit="cover" />
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
        {listed.length > 0 && <Row heading="❤️ Listem">{listed.map(card)}</Row>}
        {vertical.length > 0 && (
          <Row heading="📱 Dikey Diziler">
            {vertical.map((t) => <TitleCard key={t.id} title={t} shape="portrait" />)}
          </Row>
        )}
        {series.length > 0 && (
          <Row heading="🍿 Diziler">
            {series.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
        {films.length > 0 && (
          <Row heading="🎬 Filmler">
            {films.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
        {genres.map((genre) => (
          <Row key={genre} heading={genre}>
            {titles.filter((t) => t.genres?.includes(genre)).map(card)}
          </Row>
        ))}
      </ScrollView>
      {topBar}
    </View>
  );
}

type HeroProps = {
  title: TitleWithEpisodes;
  progress: WatchProgress[];
  inMyList: boolean;
  onToggleMyList: () => void;
};

function Hero({ title, progress, inMyList, onToggleMyList }: HeroProps) {
  const resume = resumeTarget(title, progress);
  const image = title.orientation === 'vertical' ? portraitImage(title) : landscapeImage(title);

  return (
    <View style={{ height: HERO_HEIGHT, justifyContent: 'flex-end' }}>
      {image && <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />}
      <View style={styles.heroShade} />
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>{title.name}</Text>
        {!!title.genres?.length && <Text style={styles.heroGenres}>{title.genres.slice(0, 3).join(' • ')}</Text>}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={styles.infoButton} onPress={onToggleMyList}>
            <Text style={styles.infoText}>{inMyList ? '✓' : '+'}</Text>
          </Pressable>
          {resume && (
            <Link href={{ pathname: '/watch/[uid]', params: { uid: resume.videoUid } }} asChild>
              <Pressable style={styles.playButton}>
                <Text style={styles.playText}>▶ {resume.resumed ? 'Devam et' : 'Oynat'}</Text>
              </Pressable>
            </Link>
          )}
          <Link href={{ pathname: '/title/[id]', params: { id: title.id } }} asChild>
            <Pressable style={styles.infoButton}>
              <Text style={styles.infoText}>ⓘ</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

// Son izlenenden başlayarak her dizi için kaldığı (ya da bittiyse sıradaki) bölüm
function continueWatching(progress: WatchProgress[], titles: TitleWithEpisodes[]) {
  const items: { title: TitleWithEpisodes; videoUid: string; label: string; percent: number }[] = [];
  const seen = new Set<string>();
  for (const p of progress) {
    const title = titles.find((t) => t.video_uid === p.video_uid || t.episodes.some((e) => e.video_uid === p.video_uid));
    if (!title || seen.has(title.id)) continue;
    seen.add(title.id);
    const target = resumeTarget(title, progress);
    if (!target?.resumed) continue;
    const at = progress.find((x) => x.video_uid === target.videoUid);
    const percent = at?.duration_seconds ? (at.position_seconds / at.duration_seconds) * 100 : 0;
    const episode = title.episodes.find((e) => e.video_uid === target.videoUid);
    items.push({ title, videoUid: target.videoUid, percent, label: episode ? `S${episode.season}:B${episode.number}` : '' });
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
  search: { fontSize: 20, marginRight: 14 },
  heroGenres: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  login: { color: '#fff', backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, fontWeight: '700', overflow: 'hidden' },
  muted: { color: colors.muted },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,10,38,0.45)' },
  heroContent: { padding: 16, gap: 14, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  playButton: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12 },
  playText: { color: '#fff', fontWeight: '800' },
  infoButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12 },
  infoText: { color: '#fff', fontWeight: '700' },
  continueCard: { width: 220, aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card, justifyContent: 'flex-end' },
  continueText: { color: '#fff', fontWeight: '600', fontSize: 13, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBar: { height: 3, backgroundColor: colors.accent },
});
