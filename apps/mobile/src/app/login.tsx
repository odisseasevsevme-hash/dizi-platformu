import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage('E-postana gelen onay bağlantısına tıkla, sonra giriş yap.');
    router.back();
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={[styles.button, busy && { opacity: 0.5 }]} disabled={busy} onPress={submit}>
        <Text style={styles.buttonText}>{mode === 'login' ? 'Giriş yap' : 'Kayıt ol'}</Text>
      </Pressable>
      {message && <Text style={styles.text}>{message}</Text>}
      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.muted}>{mode === 'login' ? 'Hesabın yok mu? Kayıt ol' : 'Hesabın var mı? Giriş yap'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#333', borderRadius: 6, padding: 12, color: colors.text },
  button: { backgroundColor: colors.accent, borderRadius: 6, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  text: { color: colors.text },
  muted: { color: colors.muted },
});
