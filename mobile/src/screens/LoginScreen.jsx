import {
  View, Text, TextInput, TouchableOpacity, Image, Platform,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import { COLORS }   from '../utils/helpers';

export default function LoginScreen({ navigation }) {
  const { login }      = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim())  return Alert.alert('Error', 'Email is required');
    if (!password)      return Alert.alert('Error', 'Password is required');

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        Alert.alert(
          'Server Starting Up',
          'The server is waking up from sleep mode. Please wait a few seconds and try again.',
          [{ text: 'OK' }]
        );
      } else if (!err.response) {
        Alert.alert(
          'Connection Error',
          'Could not reach the server. Check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed',
          err.response?.data?.message || 'Invalid email or password'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Background Decorative Accent Circles */}
      <View style={s.bgDecorationTop} />
      <View style={s.bgDecorationBottom} />

      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={s.appName}>Paisa Pulse</Text>
        <Text style={s.appSub}>Smart Personal & Event Finance Manager</Text>
      </View>

      {/* Card */}
      <View style={s.card}>
        <Text style={s.title}>Welcome Back</Text>
        <Text style={s.subtitle}>Sign in to your account</Text>

        <Text style={s.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={COLORS.teal200}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={COLORS.teal200}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={s.btnText}>Sign In →</Text>
          }
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { flexGrow: 1, justifyContent: 'center', padding: 20, position: 'relative' },
  bgDecorationTop: {
    position: 'absolute', top: -80, right: -80, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(0, 70, 67, 0.05)',
  },
  bgDecorationBottom: {
    position: 'absolute', bottom: -80, left: -80, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(0, 70, 67, 0.05)',
  },
  logoWrap:  { alignItems: 'center', marginBottom: 28 },
  logoCircle:{
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  logoImg:   { width: 54, height: 54 },
  appName:   {
    fontSize: 30, fontWeight: '700', color: COLORS.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  appSub:    { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
    borderWidth: 1, borderColor: 'rgba(179, 208, 206, 0.4)',
  },
  title:    {
    fontSize: 22, fontWeight: '700', color: COLORS.onSurface, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 24 },
  label: {
    fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5, marginBottom: 6, marginTop: 16,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.white,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.onSurfaceVariant, fontSize: 13 },
  footerLink: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});