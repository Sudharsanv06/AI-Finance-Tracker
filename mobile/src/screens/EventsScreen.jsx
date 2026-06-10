import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth }  from '../context/AuthContext';
import api          from '../services/api';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';

const CATEGORIES = [
  'Conference','Wedding','Corporate','Venue','Catering',
  'Decoration','Entertainment','Marketing','Equipment',
  'Staff','Transportation','Others',
];

// ── Add Event Modal ───────────────────────────────────────────────────────────
function AddEventModal({ visible, onClose, onSaved }) {
  const [name,        setName]        = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [category,    setCategory]    = useState('Conference');
  const [date,        setDate]        = useState('');
  const [status,      setStatus]      = useState('active');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    if (!name.trim())   return Alert.alert('Error', 'Event name is required');
    if (!totalBudget)   return Alert.alert('Error', 'Budget is required');

    setLoading(true);
    try {
      await api.post('/events', {
        name: name.trim(),
        totalBudget: parseFloat(totalBudget),
        category, status,
        date: date || undefined,
      });
      setName(''); setTotalBudget(''); setCategory('Conference');
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>New Event</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={ms.error}>⚠️ {error}</Text>
        )}

        <Text style={ms.label}>EVENT NAME *</Text>
        <TextInput style={ms.input} value={name} onChangeText={setName}
          placeholder="e.g. Annual Conference 2025"
          placeholderTextColor={COLORS.teal100} />

        <Text style={ms.label}>TOTAL BUDGET (₹) *</Text>
        <TextInput style={ms.input} value={totalBudget}
          onChangeText={setTotalBudget}
          placeholder="100000" placeholderTextColor={COLORS.teal100}
          keyboardType="numeric" />

        <Text style={ms.label}>CATEGORY</Text>
        <View style={ms.categoryGrid}>
          {CATEGORIES.slice(0, 6).map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={[ms.catBtn, category === c && ms.catBtnActive]}>
              <Text style={[ms.catText, category === c && ms.catTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ms.label}>STATUS</Text>
        <View style={ms.statusRow}>
          {['active','upcoming','draft'].map((s) => (
            <TouchableOpacity key={s} onPress={() => setStatus(s)}
              style={[ms.statusBtn, status === s && ms.statusBtnActive]}>
              <Text style={[ms.statusText, status === s && ms.statusTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[ms.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.cream} />
            : <Text style={ms.submitText}>+ Create Event</Text>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event }) {
  const spent   = event.spentAmount || 0;
  const budget  = event.totalBudget || 0;
  const pct     = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const isOver  = spent > budget;

  const barColor =
    pct >= 90 ? COLORS.red   :
    pct >= 70 ? COLORS.amber :
    COLORS.teal;

  const statusColors = {
    active:    { bg: COLORS.teal50,  text: COLORS.teal  },
    upcoming:  { bg: '#f3e8ff',       text: '#7c3aed'    },
    completed: { bg: '#f0fdf4',       text: COLORS.green },
    draft:     { bg: COLORS.gray100,  text: COLORS.gray  },
    cancelled: { bg: '#fef2f2',       text: COLORS.red   },
  };
  const sc = statusColors[event.status] || statusColors.active;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle} numberOfLines={1}>{event.name}</Text>
          <Text style={s.cardSub}>{event.category} • {formatDate(event.date)}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusBadgeText, { color: sc.text }]}>
            {event.status}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={s.progressSection}>
        <View style={s.progressRow}>
          <Text style={s.progressLabel}>Budget Used</Text>
          <Text style={[s.progressPct, { color: isOver ? COLORS.red : COLORS.teal }]}>
            {pct}% {isOver ? '⚠️' : ''}
          </Text>
        </View>
        <View style={s.progressBar}>
          <View style={[s.progressFill, {
            width: `${pct}%`,
            backgroundColor: barColor,
          }]} />
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statVal}>{formatCurrency(budget)}</Text>
          <Text style={s.statLab}>Budget</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: isOver ? COLORS.red : COLORS.teal }]}>
            {formatCurrency(spent)}
          </Text>
          <Text style={s.statLab}>Spent</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, {
            color: isOver ? COLORS.red : COLORS.green,
          }]}>
            {formatCurrency(Math.abs(budget - spent))}
          </Text>
          <Text style={s.statLab}>{isOver ? 'Over' : 'Left'}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const { user }                          = useAuth();
  const [events,       setEvents]         = useState([]);
  const [loading,      setLoading]        = useState(true);
  const [refreshing,   setRefreshing]     = useState(false);
  const [showAdd,      setShowAdd]        = useState(false);
  const [filterStatus, setFilterStatus]   = useState('All');

  const canCreate =
    user?.role === 'Organizer' || user?.role === 'FinanceAdmin';

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data?.data?.events || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter((e) =>
    filterStatus === 'All' || e.status === filterStatus
  );

  const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
  const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Events</Text>
          <Text style={s.sub}>{events.length} events tracked</Text>
        </View>
        {canCreate && (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary */}
      {events.length > 0 && (
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryVal}>{formatCurrency(totalBudget)}</Text>
            <Text style={s.summaryLab}>Total Budget</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryVal}>{formatCurrency(totalSpent)}</Text>
            <Text style={s.summaryLab}>Total Spent</Text>
          </View>
          <View style={[s.summaryCard, {
            backgroundColor: totalSpent > totalBudget ? '#fef2f2' : '#f0fdf4',
          }]}>
            <Text style={[s.summaryVal, {
              color: totalSpent > totalBudget ? COLORS.red : COLORS.green,
            }]}>
              {formatCurrency(Math.abs(totalBudget - totalSpent))}
            </Text>
            <Text style={s.summaryLab}>
              {totalSpent > totalBudget ? 'Over' : 'Remaining'}
            </Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={s.filterRow}>
        {['All','active','upcoming','completed','draft'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilterStatus(f)}
            style={[s.filterBtn, filterStatus === f && s.filterBtnActive]}>
            <Text style={[s.filterText, filterStatus === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchEvents(); }}
            tintColor={COLORS.teal} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📅</Text>
            <Text style={s.emptyText}>
              {filterStatus === 'All'
                ? 'No events yet'
                : `No ${filterStatus} events`}
            </Text>
            {canCreate && filterStatus === 'All' && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={s.emptyBtnText}>+ Create First Event</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <AddEventModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); fetchEvents(); }}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', color: COLORS.teal },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.teal50, alignItems: 'center', justifyContent: 'center' },
  closeText:{ fontSize: 14, color: COLORS.teal, fontWeight: '700' },
  error:    { color: COLORS.red, fontSize: 13, marginBottom: 10 },
  label:    { fontSize: 10, fontWeight: '700', color: COLORS.tealLight, letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input:    { borderWidth: 1.5, borderColor: COLORS.teal100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.teal },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.teal100 },
  catBtnActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal50 },
  catText:  { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  catTextActive: { color: COLORS.teal },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.teal100, alignItems: 'center' },
  statusBtnActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal50 },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  statusTextActive: { color: COLORS.teal },
  submitBtn: { backgroundColor: COLORS.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title:     { fontSize: 22, fontWeight: '800', color: COLORS.teal },
  sub:       { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  addBtn:    { backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText:{ color: COLORS.cream, fontSize: 13, fontWeight: '700' },
  summaryRow:{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.teal100 },
  summaryVal:  { fontSize: 12, fontWeight: '800', color: COLORS.teal },
  summaryLab:  { fontSize: 9, color: COLORS.gray, marginTop: 2, textAlign: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.teal100 },
  filterBtnActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  filterText: { fontSize: 10, fontWeight: '600', color: COLORS.gray },
  filterTextActive: { color: COLORS.cream },
  list: { padding: 12, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.teal100, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.teal },
  cardSub:   { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  progressSection: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: COLORS.gray },
  progressPct:   { fontSize: 11, fontWeight: '800' },
  progressBar:   { height: 8, backgroundColor: COLORS.creamDark, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat:     { flex: 1, backgroundColor: COLORS.teal50, borderRadius: 10, padding: 8, alignItems: 'center' },
  statVal:  { fontSize: 11, fontWeight: '800', color: COLORS.teal },
  statLab:  { fontSize: 9, color: COLORS.gray, marginTop: 2 },
  empty:    { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:{ fontSize: 40, marginBottom: 10 },
  emptyText:{ fontSize: 14, color: COLORS.gray, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: COLORS.cream, fontSize: 13, fontWeight: '700' },
});