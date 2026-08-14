import {
  View, Text, TextInput, TouchableOpacity, Image, Platform,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import { COLORS }   from '../utils/helpers';

export default function RegisterScreen({ navigation }) {
  const { register }      = useAuth();
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role,            setRole]            = useState('FinanceAdmin');
  const [loading,         setLoading]         = useState(false);

  const handleRegister = async () => {
    if (!name.trim())             return Alert.alert('Error', 'Name is required');
    if (!email.trim())            return Alert.alert('Error', 'Email is required');
    if (password.length < 6)      return Alert.alert('Error', 'Password must be at least 6 characters');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
    } catch (err) {
      let msg = 'Something went wrong. Please try again.';
      if (err.response?.data?.message && typeof err.response.data.message === 'string') {
        msg = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timeout. The server took too long to respond.';
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response) {
        msg = `Could not reach the server at ${err.config?.baseURL || 'backend URL'}. Ensure the backend server is running and accessible over Wi-Fi/network.`;
      } else if (err.message) {
        msg = err.message;
      }
      Alert.alert('Registration Failed', msg);
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

      <View style={s.card}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join Paisa Pulse today</Text>

        <Text style={s.label}>FULL NAME</Text>
        <TextInput style={s.input} value={name} onChangeText={setName}
          placeholder="Your full name" placeholderTextColor={COLORS.teal200}
          autoCapitalize="words" />

        <Text style={s.label}>EMAIL ADDRESS</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={COLORS.teal200}
          keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="Min 6 characters" placeholderTextColor={COLORS.teal200}
          secureTextEntry />

        <Text style={s.label}>CONFIRM PASSWORD</Text>
        <TextInput
          style={[
            s.input,
            confirmPassword.length > 0 && {
              borderColor: confirmPassword === password ? COLORS.green : COLORS.red,
            },
          ]}
          value={confirmPassword} onChangeText={setConfirmPassword}
          placeholder="Re-enter password" placeholderTextColor={COLORS.teal200}
          secureTextEntry />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={s.btnText}>Create Account →</Text>
          }
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { flexGrow: 1, padding: 20, paddingTop: 40, justifyContent: 'center', position: 'relative' },
  bgDecorationTop: {
    position: 'absolute', top: -80, right: -80, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(0, 70, 67, 0.05)',
  },
  bgDecorationBottom: {
    position: 'absolute', bottom: -80, left: -80, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(0, 70, 67, 0.05)',
  },
  logoWrap:  { alignItems: 'center', marginBottom: 24 },
  logoCircle:{
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    overflow: 'hidden', shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  logoImg:  { width: 50, height: 50 },
  appName:  {
    fontSize: 28, fontWeight: '700', color: COLORS.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  appSub:   { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
    borderWidth: 1, borderColor: 'rgba(179, 208, 206, 0.4)',
  },
  title:    {
    fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 20 },
  label: {
    fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5, marginBottom: 6, marginTop: 14,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.white,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:  { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  footer:   { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: COLORS.onSurfaceVariant, fontSize: 13 },
  footerLink: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});