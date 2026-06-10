import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import { COLORS }   from '../utils/helpers';

const ROLES = [
  { val: 'Organizer',    label: 'Organizer',    icon: '🎯', desc: 'Create events' },
  { val: 'Approver',     label: 'Approver',     icon: '✅', desc: 'Approve expenses' },
  { val: 'FinanceAdmin', label: 'Finance Admin', icon: '💼', desc: 'Full access' },
];

export default function RegisterScreen({ navigation }) {
  const { register }      = useAuth();
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role,            setRole]            = useState('Organizer');
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
      Alert.alert('Registration Failed',
        err.response?.data?.message || 'Something went wrong'
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
      </View>

      <View style={s.card}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join EventFi today</Text>

        <Text style={s.label}>FULL NAME</Text>
        <TextInput style={s.input} value={name} onChangeText={setName}
          placeholder="Your full name" placeholderTextColor={COLORS.teal100}
          autoCapitalize="words" />

        <Text style={s.label}>EMAIL ADDRESS</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={COLORS.teal100}
          keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>YOUR ROLE</Text>
        <View style={s.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.val}
              onPress={() => setRole(r.val)}
              style={[s.roleCard, role === r.val && s.roleCardActive]}
              activeOpacity={0.8}
            >
              <Text style={s.roleIcon}>{r.icon}</Text>
              <Text style={[s.roleLabel, role === r.val && s.roleLabelActive]}>
                {r.label}
              </Text>
              <Text style={s.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>PASSWORD</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="Min 6 characters" placeholderTextColor={COLORS.teal100}
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
          placeholder="Re-enter password" placeholderTextColor={COLORS.teal100}
          secureTextEntry />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.cream} />
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
  container: { flex: 1, backgroundColor: COLORS.cream },
  content:   { flexGrow: 1, padding: 20, paddingTop: 60 },
  logoWrap:  { alignItems: 'center', marginBottom: 24 },
  logoCircle:{
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.teal,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoText: { color: COLORS.cream, fontSize: 24, fontWeight: '800' },
  appName:  { fontSize: 24, fontWeight: '800', color: COLORS.teal },
  card: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: COLORS.teal100,
  },
  title:    { fontSize: 20, fontWeight: '800', color: COLORS.teal, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 20 },
  label: {
    fontSize: 10, fontWeight: '700', color: COLORS.tealLight,
    letterSpacing: 1, marginBottom: 6, marginTop: 14,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.teal100,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: COLORS.teal, backgroundColor: COLORS.white,
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, borderWidth: 2, borderColor: COLORS.teal100,
    borderRadius: 14, padding: 10, alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roleCardActive: {
    borderColor: COLORS.teal, backgroundColor: COLORS.teal50,
  },
  roleIcon:  { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray, textAlign: 'center' },
  roleLabelActive: { color: COLORS.teal },
  roleDesc:  { fontSize: 9, color: COLORS.gray, textAlign: 'center', marginTop: 2 },
  btn: {
    backgroundColor: COLORS.teal, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:  { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  footer:   { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: COLORS.gray, fontSize: 13 },
  footerLink: { color: COLORS.teal, fontSize: 13, fontWeight: '700' },
});