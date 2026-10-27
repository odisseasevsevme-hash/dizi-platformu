import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { landscapeImage, portraitImage } from '@/lib/catalog';
import { colors } from '@/lib/colors';
import type { TitleWithEpisodes } from '@/lib/types';

export function Row({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.heading}>{heading}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller}>
        {children}
      </ScrollView>
    </View>
  );
}

export function TitleCard({ title, shape }: { title: TitleWithEpisodes; shape: 'portrait' | 'landscape' }) {
  const image = shape === 'portrait' ? portraitImage(title) : landscapeImage(title);
  const size = shape === 'portrait' ? styles.portrait : styles.landscape;

  return (
    <Link href={{ pathname: '/title/[id]', params: { id: title.id } }} asChild>
      <Pressable style={[styles.card, size]}>
        {image && <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />}
        <View style={styles.shade} />
        <Text numberOfLines={2} style={styles.cardText}>
          {title.name}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800', paddingHorizontal: 16 },
  scroller: { gap: 8, paddingHorizontal: 16 },
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card, justifyContent: 'flex-end' },
  portrait: { width: 120, aspectRatio: 9 / 16 },
  landscape: { width: 220, aspectRatio: 16 / 9 },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,10,38,0.3)' },
  cardText: { color: '#fff', fontWeight: '800', fontSize: 13, padding: 10 },
});
