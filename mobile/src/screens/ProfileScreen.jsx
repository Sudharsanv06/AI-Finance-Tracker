import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useAuth }             from '../context/AuthContext';
import { COLORS, getInitials } from '../utils/helpers';

const MENU_ITEMS = [
  { icon: '🎯', label: 'Financial Goals', screen: 'Goals' },
  { icon: '📊', label: 'Budget Planner',  screen: 'BudgetPlanner' },
  { icon: '💳', label: 'Bill Reminders',  screen: 'BillReminders' },
  { icon: '📈', label: 'Investments',      screen: 'Investments' },
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
      </View>

      {/* App info */}
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>AI Finance Tracker v1.00</Text>
        <Text style={s.infoSub}>Smart Finance Manager</Text>
        <View style={s.infoDivider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Backend</Text>
          <Text style={s.infoValue}>Node / Express / MongoDB</Text>
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
                Alert.alert('Web App', `${item.label} is available on the web app.`);
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

      <Text style={s.version}>AI Finance Tracker v1.00 • Built with React Native + Expo</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 16, paddingTop: 56, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#0058be', // EventFi Core primary
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  name:   { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  email:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  roleText:  { fontSize: 12, fontWeight: '700', color: COLORS.white },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  infoSub:   { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2, marginBottom: 12 },
  infoDivider: { height: 1, backgroundColor: 'rgba(194, 198, 214, 0.1)', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 12, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  menuTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(194, 198, 214, 0.1)',
  },
  menuIcon:  { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuLink:  { fontSize: 10, color: COLORS.onSurfaceVariant, fontStyle: 'italic' },
  menuArrow: { fontSize: 20, color: COLORS.outlineVariant },
  logoutBtn: {
    backgroundColor: COLORS.red50,
    borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 20,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: { color: COLORS.red, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.onSurfaceVariant },
});