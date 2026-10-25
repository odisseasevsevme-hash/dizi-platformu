import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/colors';
import { posterFor } from '@/lib/stream';
import { supabase } from '@/lib/supabase';
import type { Title } from '@/lib/types';

export default function Catalog() {
  const [titles, setTitles] = useState<Title[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('titles').select('*').order('created_at', { ascending: false });
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

  if (!titles) return <Text style={styles.muted}>Yükleniyor…</Text>;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />}>
      {titles.length === 0 && <Text style={styles.muted}>Henüz içerik yok.</Text>}
      <Row heading="Diziler" titles={titles.filter((t) => t.kind === 'series')} />
      <Row heading="Filmler" titles={titles.filter((t) => t.kind === 'film')} />
    </ScrollView>
  );
}

function Row({ heading, titles }: { heading: string; titles: Title[] }) {
  if (titles.length === 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.heading}>{heading}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {titles.map((t) => (
          <Link key={t.id} href={{ pathname: '/title/[id]', params: { id: t.id } }} asChild>
            <Pressable style={styles.card}>
              {posterFor(t) ? (
                <Image source={posterFor(t)} style={styles.poster} contentFit="cover" />
              ) : (
                <View style={[styles.poster, styles.placeholder]}>
                  <Text style={styles.cardText}>{t.name}</Text>
                </View>
              )}
              <Text numberOfLines={1} style={styles.cardText}>
                {t.name}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 24 },
  row: { gap: 10 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '600' },
  card: { width: 120, gap: 6 },
  poster: { width: 120, height: 180, borderRadius: 6, backgroundColor: colors.card },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  cardText: { color: colors.text, fontSize: 13 },
  muted: { color: colors.muted, padding: 16 },
});
