import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useAuth }             from '../context/AuthContext';
import { COLORS, getInitials } from '../utils/helpers';

const MENU_ITEMS = [
  { icon: '🎯', label: 'Financial Goals', screen: 'Goals' },
  { icon: '📊', label: 'Budget Planner',  link: 'Web only' },
  { icon: '💳', label: 'Bill Reminders',  link: 'Web only' },
  { icon: '📈', label: 'Investments',      link: 'Web only' },
  { icon: '👨‍👩‍👧‍👦', label: 'Family Members',  link: 'Web only' },
];

const ROLE_CONFIG = {
  Organizer:    { color: COLORS.teal,  bg: COLORS.teal50,  label: 'Organizer'    },
  Approver:     { color: '#d97706',    bg: '#fffbeb',       label: 'Approver'     },
  FinanceAdmin: { color: '#16a34a',    bg: '#f0fdf4',       label: 'Finance Admin' },
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const rc = ROLE_CONFIG[user?.role] || ROLE_CONFIG.Organizer;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{getInitials(user?.name)}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <View style={[s.roleBadge, { backgroundColor: rc.bg }]}>
          <Text style={[s.roleText, { color: rc.color }]}>{rc.label}</Text>
        </View>
      </View>

      {/* App info */}
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>EventFi V2</Text>
        <Text style={s.infoSub}>Smart Finance Manager</Text>
        <View style={s.infoDivider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Backend</Text>
          <Text style={s.infoValue}>Render (Free)</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Frontend</Text>
          <Text style={s.infoValue}>Vercel</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Mobile</Text>
          <Text style={s.infoValue}>Expo / React Native</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={s.menuCard}>
        <Text style={s.menuTitle}>More Features</Text>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={s.menuItem}
            onPress={() => {
              if (item.screen) {
                navigation.navigate(item.screen);
              } else {
                Alert.alert('Web App', `${item.label} is available on the web app at your Vercel URL.`);
              }
            }}
          >
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <View style={s.menuRight}>
              {item.link && (
                <Text style={s.menuLink}>{item.link}</Text>
              )}
              <Text style={s.menuArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={s.version}>EventFi V2 • Built with React Native + Expo</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content:   { padding: 16, paddingTop: 56, paddingBottom: 40 },
  profileCard: {
    backgroundColor: COLORS.teal, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.cream },
  name:   { fontSize: 20, fontWeight: '800', color: COLORS.cream, marginBottom: 4 },
  email:  { fontSize: 13, color: 'rgba(240,237,229,0.7)', marginBottom: 10 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText:  { fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.teal100,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: COLORS.teal },
  infoSub:   { fontSize: 12, color: COLORS.gray, marginTop: 2, marginBottom: 12 },
  infoDivider: { height: 1, backgroundColor: COLORS.teal50, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 12, color: COLORS.gray },
  infoValue: { fontSize: 12, fontWeight: '700', color: COLORS.teal },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.teal100,
  },
  menuTitle: { fontSize: 14, fontWeight: '800', color: COLORS.teal, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.teal50,
  },
  menuIcon:  { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.teal },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuLink:  { fontSize: 10, color: COLORS.gray, fontStyle: 'italic' },
  menuArrow: { fontSize: 20, color: COLORS.teal100 },
  logoutBtn: {
    backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  logoutText: { color: COLORS.red, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.gray },
});