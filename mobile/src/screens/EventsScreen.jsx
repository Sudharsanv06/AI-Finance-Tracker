import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth }  from '../context/AuthContext';
import api          from '../services/api';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const CATEGORIES = [
  'Conference','Wedding','Corporate','Venue','Catering',
  'Decoration','Entertainment','Marketing','Equipment',
  'Staff','Transportation','Others',
];

// ── Custom Date Picker Modal ──────────────────────────────────────────────────
function CustomDatePickerModal({ visible, date, onSelect, onClose }) {
  const [currentYear, setCurrentYear] = useState(date.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(date.getMonth());

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDays = () => {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0);
    const startDay = start.getDay();
    const numDays = end.getDate();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= numDays; i++) days.push(new Date(currentYear, currentMonth, i));
    return days;
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ds.overlay}>
        <View style={ds.content}>
          <View style={ds.header}>
            <TouchableOpacity onPress={prevMonth} style={ds.arrow}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={ds.title}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={ds.arrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={ds.weekRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={ds.weekText}>{d}</Text>
            ))}
          </View>
          <View style={ds.daysGrid}>
            {getDays().map((day, idx) => (
              <TouchableOpacity
                key={idx}
                disabled={!day}
                style={[
                  ds.dayCell,
                  day && date.toDateString() === day.toDateString() && ds.dayCellActive
                ]}
                onPress={() => {
                  onSelect(day);
                  onClose();
                }}
              >
                <Text style={[
                  ds.dayText,
                  !day && { color: 'transparent' },
                  day && date.toDateString() === day.toDateString() && ds.dayTextActive
                ]}>
                  {day ? day.getDate() : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={ds.closeBtn} onPress={onClose}>
            <Text style={ds.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Event Form Modal (Supports Add and Edit) ───────────────────────────────
function EventFormModal({ visible, onClose, onSaved, event }) {
  const [name,        setName]        = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [category,    setCategory]    = useState('Conference');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status,      setStatus]      = useState('active');
  const [loading,     setLoading]     = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (event) {
        setName(event.name);
        setTotalBudget(String(event.totalBudget));
        setCategory(event.category || 'Conference');
        setSelectedDate(event.date ? new Date(event.date) : new Date());
        setStatus(event.status || 'active');
      } else {
        setName('');
        setTotalBudget('');
        setCategory('Conference');
        setSelectedDate(new Date());
        setStatus('active');
      }
    }
  }, [visible, event]);

  const handleSubmit = async () => {
    if (!name.trim())   return Alert.alert('Error', 'Event name is required');
    if (!totalBudget || isNaN(totalBudget)) return Alert.alert('Error', 'Valid budget is required');

    setLoading(true);
    const payload = {
      name: name.trim(),
      totalBudget: parseFloat(totalBudget),
      category,
      status,
      date: selectedDate.toISOString(),
    };

    try {
      if (event) {
        await api.put(`/events/${event._id}`, payload);
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        await api.post('/events', payload);
        Alert.alert('Success', 'Event created successfully!');
      }
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>{event ? 'Edit Event' : 'New Event'}</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={ms.label}>EVENT NAME *</Text>
          <TextInput
            style={ms.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Annual Conference 2025"
            placeholderTextColor={COLORS.outline}
          />

          <Text style={ms.label}>TOTAL BUDGET (₹) *</Text>
          <TextInput
            style={ms.input}
            value={totalBudget}
            onChangeText={setTotalBudget}
            placeholder="e.g. 100000"
            placeholderTextColor={COLORS.outline}
            keyboardType="numeric"
          />

          <Text style={ms.label}>CATEGORY</Text>
          <View style={ms.categoryGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[ms.catBtn, category === c && ms.catBtnActive]}
              >
                <Text style={[ms.catText, category === c && ms.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ms.label}>DATE</Text>
          <TouchableOpacity style={ms.selectorBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={ms.selectorBtnText}>
              {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.outline} />
          </TouchableOpacity>

          <Text style={ms.label}>STATUS</Text>
          <View style={ms.statusRow}>
            {['active', 'upcoming', 'completed', 'draft', 'cancelled'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
              >
                <Text style={[ms.statusText, status === s && ms.statusTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[ms.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={ms.submitText}>{event ? 'Update Event' : 'Create Event'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>

        <CustomDatePickerModal
          visible={showDatePicker}
          date={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setShowDatePicker(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete }) {
  const spent   = event.spentAmount || 0;
  const budget  = event.totalBudget || 0;
  const pct     = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const isOver  = spent > budget;

  const barColor =
    pct >= 90 ? '#ba1a1a'   :
    pct >= 70 ? '#825100' :
    '#0058be';

  const statusColors = {
    active:    { bg: 'rgba(0, 88, 190, 0.08)',  text: '#0058be'  },
    upcoming:  { bg: 'rgba(130, 81, 0, 0.08)',  text: '#825100'  },
    completed: { bg: 'rgba(0, 108, 73, 0.08)',  text: '#006c49'  },
    draft:     { bg: 'rgba(114, 119, 133, 0.08)', text: '#727785' },
    cancelled: { bg: 'rgba(186, 26, 26, 0.08)',  text: '#ba1a1a'  },
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
          <Text style={[s.progressPct, { color: isOver ? COLORS.red : COLORS.primary, fontSize: 13 }]}>
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
          <Text style={[s.statVal, { color: isOver ? COLORS.red : COLORS.primary }]}>
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

      {/* Actions */}
      <View style={s.actionRow}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.surfaceContainerLow }]} onPress={onEdit}>
          <Text style={[s.actionBtnText, { color: COLORS.primary }]}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]} onPress={onDelete}>
          <Text style={[s.actionBtnText, { color: COLORS.red }]}>🗑️ Delete</Text>
        </TouchableOpacity>
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
  const [showForm,      setShowForm]        = useState(false);
  const [editingEvent, setEditingEvent]   = useState(null);
  const [filterStatus, setFilterStatus]   = useState('All');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data?.data?.events || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event and all its budget logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/events/${id}`);
              fetchEvents();
              Alert.alert('Deleted', 'Event deleted successfully!');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const filtered = events.filter((e) =>
    filterStatus === 'All' || e.status === filterStatus
  );

  const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
  const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Event Tracker</Text>
          <Text style={s.sub}>{events.length} events tracked</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditingEvent(null); setShowForm(true); }}>
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
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
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item._id)}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchEvents(); }}
            tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📅</Text>
            <Text style={s.emptyText}>
              {filterStatus === 'All'
                ? 'No events yet'
                : `No ${filterStatus} events`}
            </Text>
            {filterStatus === 'All' && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => { setEditingEvent(null); setShowForm(true); }}>
                <Text style={s.emptyBtnText}>+ Create First Event</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <EventFormModal
        visible={showForm}
        event={editingEvent}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); fetchEvents(); }}
      />
    </View>
  );
}

const ds = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, width: '85%', maxWidth: 340 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  arrow: { padding: 8 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekText: { fontSize: 12, fontWeight: '700', color: COLORS.outline, width: 32, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 19, marginVertical: 2 },
  dayCellActive: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },
  dayTextActive: { color: COLORS.white },
  closeBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 10 },
  closeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary }
});

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  closeText:{ fontSize: 14, color: COLORS.onSurface, fontWeight: '700' },
  label:    { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  input:    { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background },
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.background
  },
  selectorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  catText:  { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  catTextActive: { color: COLORS.primary },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center' },
  statusBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant },
  statusTextActive: { color: COLORS.primary },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700'
  },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title:     { fontSize: 24, fontWeight: '700', color: COLORS.onSurface },
  sub:       { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn:    { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText:{ color: COLORS.white, fontSize: 14, fontWeight: '700' },
  summaryRow:{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  summaryVal:  { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  summaryLab:  { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outlineVariant },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  filterTextActive: { color: COLORS.white },
  list: { padding: 12, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  cardSub:   { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  progressSection: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  progressPct:   { fontSize: 13, fontWeight: '700' },
  progressBar:   { height: 8, backgroundColor: '#eff4ff', borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat:     { flex: 1, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal:  { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  statLab:  { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(194, 198, 214, 0.1)' },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  empty:    { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:{ fontSize: 40, marginBottom: 10 },
  emptyText:{ fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});