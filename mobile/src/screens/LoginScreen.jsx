import {
  View, Text, TextInput, TouchableOpacity,
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
      Alert.alert('Login Failed',
        err.response?.data?.message || 'Invalid email or password'
      );
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
      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>E</Text>
        </View>
        <Text style={s.appName}>EventFi</Text>
        <Text style={s.appSub}>Smart Finance Manager</Text>
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
          placeholderTextColor={COLORS.teal100}
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
          placeholderTextColor={COLORS.teal100}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.cream} />
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
  container: { flex: 1, backgroundColor: COLORS.cream },
  content:   { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoWrap:  { alignItems: 'center', marginBottom: 32 },
  logoCircle:{
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.teal,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText:  { color: COLORS.cream, fontSize: 28, fontWeight: '800' },
  appName:   { fontSize: 28, fontWeight: '800', color: COLORS.teal },
  appSub:    { fontSize: 13, color: COLORS.tealLight, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: COLORS.teal100,
  },
  title:    { fontSize: 22, fontWeight: '800', color: COLORS.teal, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 24 },
  label: {
    fontSize: 10, fontWeight: '700', color: COLORS.tealLight,
    letterSpacing: 1, marginBottom: 6, marginTop: 16,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.teal100,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: COLORS.teal, backgroundColor: COLORS.white,
  },
  btn: {
    backgroundColor: COLORS.teal, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.gray, fontSize: 13 },
  footerLink: { color: COLORS.teal, fontSize: 13, fontWeight: '700' },
});