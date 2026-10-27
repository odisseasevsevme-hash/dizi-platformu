import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TitleCard } from '@/components/Row';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import type { TitleWithEpisodes } from '@/lib/types';

// Türkçe harf ve büyük/küçük harf farkını yok sayarak karşılaştırmak için
function normalize(text: string) {
  return text
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i');
}

export default function SearchScreen() {
  const [titles, setTitles] = useState<TitleWithEpisodes[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    supabase
      .from('titles')
      .select('*, episodes(video_uid, season, number)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTitles(data ?? []));
  }, []);

  const genres = [...new Set(titles.flatMap((t) => t.genres ?? []))].sort((a, b) => a.localeCompare(b, 'tr'));
  const q = normalize(query.trim());
  const results = q
    ? titles.filter((t) => normalize([t.name, t.description ?? '', ...(t.genres ?? [])].join(' ')).includes(q))
    : titles;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Ara' }} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Film, dizi veya tür ara"
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoFocus
        returnKeyType="search"
      />
      {genres.length > 0 && (
        <View style={styles.chips}>
          {genres.map((g) => {
            const active = normalize(g) === q;
            return (
              <Pressable key={g} onPress={() => setQuery(active ? '' : g)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={styles.chipText}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {results.length === 0 && <Text style={styles.muted}>Sonuç yok.</Text>}
      <View style={styles.grid}>
        {results.map((t) => (
          <TitleCard key={t.id} title={t} shape="portrait" />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  input: { backgroundColor: colors.card, color: colors.text, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '700' },
  muted: { color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
