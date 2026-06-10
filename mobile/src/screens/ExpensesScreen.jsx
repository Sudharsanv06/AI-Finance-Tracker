import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth }           from '../context/AuthContext';
import * as expenseService   from '../services/expenseService';
import api                   from '../services/api';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';

const STATUS_COLOR = {
  Pending:  { bg: '#fffbeb', text: '#d97706' },
  Approved: { bg: '#f0fdf4', text: '#16a34a' },
  Rejected: { bg: '#fef2f2', text: '#dc2626' },
  Paid:     { bg: COLORS.teal50, text: COLORS.teal },
};

// ── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({ visible, onClose, onSaved }) {
  const [description,   setDescription]   = useState('');
  const [amount,        setAmount]        = useState('');
  const [category,      setCategory]      = useState('Others');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [events,        setEvents]        = useState([]);
  const [eventId,       setEventId]       = useState('');
  const [loading,       setLoading]       = useState(false);
  const [categorizing,  setCategorizing]  = useState(false);

  useEffect(() => {
    if (visible) {
      api.get('/events').then((r) => {
        const evList = r.data?.data?.events || [];
        setEvents(evList);
        if (evList.length > 0) setEventId(evList[0]._id);
      }).catch(() => {});
    }
  }, [visible]);

  const aiCategorize = async () => {
    if (!description.trim()) return;
    setCategorizing(true);
    try {
      const res = await api.post('/ai/categorize', { description });
      setCategory(res.data?.data?.category || 'Others');
    } catch {}
    finally { setCategorizing(false); }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return Alert.alert('Error', 'Description required');
    if (!amount || isNaN(amount)) return Alert.alert('Error', 'Valid amount required');
    if (!eventId) return Alert.alert('Error', 'Select an event');

    setLoading(true);
    try {
      await expenseService.createExpense({
        description: description.trim(),
        amount: parseFloat(amount),
        category, paymentMethod, eventId,
      });
      setDescription(''); setAmount(''); setCategory('Others');
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>Add Expense</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={ms.label}>EVENT</Text>
        <View style={ms.input}>
          {events.map((ev) => (
            <TouchableOpacity
              key={ev._id}
              onPress={() => setEventId(ev._id)}
              style={[ms.evOption, eventId === ev._id && ms.evOptionActive]}>
              <Text style={[ms.evText, eventId === ev._id && ms.evTextActive]}>
                {ev.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ms.label}>DESCRIPTION</Text>
        <TextInput style={ms.textInput} value={description}
          onChangeText={setDescription} placeholder="e.g. Venue booking"
          placeholderTextColor={COLORS.teal100} />

        {description.trim().length > 3 && (
          <TouchableOpacity onPress={aiCategorize} style={ms.aiBtn} disabled={categorizing}>
            <Text style={ms.aiBtnText}>
              {categorizing ? '⏳ Categorizing...' : '🤖 Auto-categorize'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={ms.label}>AMOUNT (₹)</Text>
        <TextInput style={ms.textInput} value={amount}
          onChangeText={setAmount} placeholder="5000"
          placeholderTextColor={COLORS.teal100} keyboardType="numeric" />

        <Text style={ms.label}>CATEGORY: {category}</Text>

        <TouchableOpacity
          style={[ms.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.cream} />
            : <Text style={ms.submitText}>+ Submit Expense</Text>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ExpensesScreen() {
  const { user }                         = useAuth();
  const [expenses,   setExpenses]        = useState([]);
  const [loading,    setLoading]         = useState(true);
  const [refreshing, setRefreshing]      = useState(false);
  const [showAdd,    setShowAdd]         = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const userRole  = user?.role || 'Organizer';
  const canSubmit = userRole === 'Organizer' || userRole === 'FinanceAdmin';
  const canApprove = userRole === 'Approver' || userRole === 'FinanceAdmin';

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expenseService.getExpenses();
      setExpenses(res.data?.expenses || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleApprove = async (id) => {
    try {
      await expenseService.approveExpense(id);
      fetchExpenses();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = (id) => {
    Alert.prompt(
      'Reject Expense',
      'Enter rejection reason:',
      async (reason) => {
        if (!reason?.trim()) return;
        try {
          await expenseService.rejectExpense(id, reason);
          fetchExpenses();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed');
        }
      }
    );
  };

  const filtered = expenses.filter((e) =>
    filterStatus === 'All' || e.approvalStatus === filterStatus
  );

  const renderItem = ({ item }) => {
    const sc = STATUS_COLOR[item.approvalStatus] || STATUS_COLOR.Pending;
    return (
      <View style={s.expCard}>
        <View style={s.expTop}>
          <View style={s.expInfo}>
            <Text style={s.expDesc} numberOfLines={1}>{item.description}</Text>
            <Text style={s.expSub}>{item.eventId?.name} • {formatDate(item.date)}</Text>
          </View>
          <View style={s.expAmountWrap}>
            <Text style={s.expAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeText, { color: sc.text }]}>
                {item.approvalStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Approval actions */}
        {canApprove && item.approvalStatus === 'Pending' && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#f0fdf4' }]}
              onPress={() => handleApprove(item._id)}>
              <Text style={[s.actionText, { color: '#16a34a' }]}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#fef2f2' }]}
              onPress={() => handleReject(item._id)}>
              <Text style={[s.actionText, { color: '#dc2626' }]}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
          <Text style={s.title}>Expenses</Text>
          <Text style={s.sub}>{expenses.length} total</Text>
        </View>
        {canSubmit && (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {['All','Pending','Approved','Rejected','Paid'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilterStatus(f)}
            style={[s.filterBtn, filterStatus === f && s.filterBtnActive]}>
            <Text style={[s.filterText, filterStatus === f && s.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchExpenses(); }}
            tintColor={COLORS.teal} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💸</Text>
            <Text style={s.emptyText}>No expenses found</Text>
          </View>
        }
      />

      <AddExpenseModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); fetchExpenses(); }}
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
  label: { fontSize: 10, fontWeight: '700', color: COLORS.tealLight, letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  textInput: { borderWidth: 1.5, borderColor: COLORS.teal100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.teal },
  input: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  evOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.teal100 },
  evOptionActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal50 },
  evText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  evTextActive: { color: COLORS.teal },
  aiBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.teal50, borderRadius: 10 },
  aiBtnText: { fontSize: 12, color: COLORS.teal, fontWeight: '700' },
  submitBtn: { backgroundColor: COLORS.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: COLORS.cream },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.teal },
  sub:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: COLORS.cream, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.teal100 },
  filterBtnActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  filterText: { fontSize: 11, fontWeight: '600', color: COLORS.gray },
  filterTextActive: { color: COLORS.cream },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  expCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.teal100, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  expTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expInfo: { flex: 1, marginRight: 10 },
  expDesc: { fontSize: 13, fontWeight: '700', color: COLORS.teal },
  expSub:  { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  expAmountWrap: { alignItems: 'flex-end' },
  expAmount: { fontSize: 14, fontWeight: '800', color: COLORS.teal },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.teal50 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.gray },
});