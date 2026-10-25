import { DarkTheme, Link, Stack, ThemeProvider } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/useSession';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, primary: colors.accent },
};

export default function RootLayout() {
  const session = useSession();

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerRight: () =>
            session ? (
              <Pressable onPress={() => supabase.auth.signOut()}>
                <Text style={{ color: colors.muted }}>Çıkış</Text>
              </Pressable>
            ) : (
              <Link href="/login" style={{ color: colors.text }}>
                Giriş
              </Link>
            ),
        }}>
        <Stack.Screen name="index" options={{ title: 'DİZİ' }} />
        <Stack.Screen name="title/[id]" options={{ title: '' }} />
        <Stack.Screen name="watch/[uid]" options={{ title: '', headerRight: undefined }} />
        <Stack.Screen name="login" options={{ title: 'Giriş', presentation: 'modal', headerRight: undefined }} />
      </Stack>
    </ThemeProvider>
  );
}
