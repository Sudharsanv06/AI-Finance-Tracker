import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SettingsScreen({ navigation }) {
  const { user, updateUser } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Save Profile Details Handler
  const handleSaveProfile = async () => {
    if (profileLoading) return;
    if (!name.trim()) {
      return Alert.alert('Validation Error', 'Name cannot be empty.');
    }
    if (!email.trim()) {
      return Alert.alert('Validation Error', 'Email cannot be empty.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Validation Error', 'Please enter a valid email address.');
    }

    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      if (res.data?.success) {
        // Update user state in context
        await updateUser({ ...user, name: name.trim(), email: email.trim().toLowerCase() });
        Alert.alert('Success', 'Profile details updated successfully.');
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.log('Update profile error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong while updating profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Update Password Handler
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      return Alert.alert('Validation Error', 'Please enter your current password.');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Validation Error', 'New passwords do not match.');
    }

    setPasswordLoading(true);
    try {
      const res = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        Alert.alert('Success', 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update password.');
      }
    } catch (err) {
      console.log('Update password error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Profile Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Profile Information</Text>
          <Text style={s.cardSub}>Update your personal profile details</Text>

          <Text style={s.label}>FULL NAME</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={COLORS.outlineVariant}
            autoCapitalize="words"
          />

          <Text style={s.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={COLORS.outlineVariant}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[s.btn, profileLoading && s.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={profileLoading}
            activeOpacity={0.85}
          >
            {profileLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.btnText}>Save Profile Info</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Security & Password</Text>
          <Text style={s.cardSub}>Keep your account secure by changing your password</Text>

          <Text style={s.label}>CURRENT PASSWORD</Text>
          <TextInput
            style={s.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={COLORS.outlineVariant}
            secureTextEntry
          />

          <Text style={s.label}>NEW PASSWORD</Text>
          <TextInput
            style={s.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min 6 characters"
            placeholderTextColor={COLORS.outlineVariant}
            secureTextEntry
          />

          <Text style={s.label}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={s.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={COLORS.outlineVariant}
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, s.securityBtn, passwordLoading && s.btnDisabled]}
            onPress={handleUpdatePassword}
            disabled={passwordLoading}
            activeOpacity={0.85}
          >
            {passwordLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.btnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={s.cancelBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194, 198, 214, 0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    backgroundColor: COLORS.background,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  securityBtn: {
    backgroundColor: '#0c2240', // premium navy theme color for security settings
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
});
