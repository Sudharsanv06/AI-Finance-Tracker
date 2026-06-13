import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  SafeAreaView
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth }           from '../context/AuthContext';
import * as expenseService   from '../services/expenseService';
import * as incomeService    from '../services/incomeService';
import api                   from '../services/api';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const STATUS_COLOR = {
  Pending:  { bg: 'rgba(130, 81, 0, 0.08)', text: '#825100' },
  Approved: { bg: 'rgba(0, 108, 73, 0.08)', text: '#006c49' },
  Rejected: { bg: 'rgba(186, 26, 26, 0.08)', text: '#ba1a1a' },
  Paid:     { bg: 'rgba(0, 88, 190, 0.08)', text: '#0058be' },
};

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Health', 'Education',
  'Utilities', 'Rent', 'Groceries',
  'Travel', 'Personal Care', 'Other'
];

const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Business', 'Rental',
  'Investment Returns', 'Gift', 'Bonus', 'Other'
];

const TRANSFER_CATEGORIES = [
  'Bank Transfer', 'Self Transfer', 'Mobile Wallet',
  'Cash Withdrawal', 'Card to Card', 'Other'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque', 'Other'];

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

// ── Expense Form Modal (Supports Add and Edit) ───────────────────────────────
function ExpenseFormModal({ visible, onClose, onSaved, expense }) {
  const [description,   setDescription]   = useState('');
  const [amount,        setAmount]        = useState('');
  const [category,      setCategory]      = useState('Other');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [status,        setStatus]        = useState('Paid'); // 'Pending' | 'Paid'
  const [loading,       setLoading]       = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCatModal,  setShowCatModal]  = useState(false);

  const isIncome = expense?.type === 'Income';

  useEffect(() => {
    if (visible) {
      if (expense) {
        setDescription(expense.description);
        setAmount(String(expense.amount));
        setCategory(expense.category || 'Other');
        setPaymentMethod(expense.paymentMethod || 'Cash');
        setSelectedDate(expense.date ? new Date(expense.date) : new Date());
        setStatus(expense.approvalStatus === 'Pending' ? 'Pending' : 'Paid');
      } else {
        setDescription('');
        setAmount('');
        setCategory('Other');
        setPaymentMethod('Cash');
        setSelectedDate(new Date());
        setStatus('Paid');
      }
    }
  }, [visible, expense]);

  const handleSubmit = async () => {
    if (!description.trim()) return Alert.alert('Error', 'Description required');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return Alert.alert('Error', 'Valid amount required');

    setLoading(true);
    try {
      if (isIncome) {
        await incomeService.updateIncome(expense._id, {
          source: category,
          amount: parseFloat(amount),
          description: description.trim(),
          date: selectedDate.toISOString()
        });
        Alert.alert('Success', 'Income updated successfully!');
      } else {
        const payload = {
          description: description.trim(),
          amount: parseFloat(amount),
          category,
          paymentMethod,
          date: selectedDate.toISOString(),
          approvalStatus: status === 'Paid' ? 'Paid' : 'Pending',
          eventId: expense?.eventId?._id || expense?.eventId || null
        };
        await expenseService.updateExpense(expense._id, payload);
        Alert.alert('Success', 'Transaction updated successfully!');
      }
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>{expense ? (isIncome ? 'Edit Income' : 'Edit Transaction') : 'Add Expense'}</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={ms.label}>DESCRIPTION</Text>
          <TextInput
            style={ms.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Vegetables & Grocery"
            placeholderTextColor={COLORS.outline}
          />

          <Text style={ms.label}>AMOUNT (₹)</Text>
          <TextInput
            style={ms.textInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 750"
            placeholderTextColor={COLORS.outline}
            keyboardType="numeric"
          />

          <Text style={ms.label}>CATEGORY</Text>
          <TouchableOpacity style={ms.selectorBtn} onPress={() => setShowCatModal(true)}>
            <Text style={ms.selectorBtnText}>{category}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
          </TouchableOpacity>

          {!isIncome && (
            <>
              <Text style={ms.label}>PAYMENT METHOD</Text>
              <View style={ms.methodRow}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[ms.methodBtn, paymentMethod === m && ms.methodBtnActive]}
                  >
                    <Text style={[ms.methodBtnText, paymentMethod === m && ms.methodBtnActiveText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={ms.label}>DATE</Text>
          <TouchableOpacity style={ms.selectorBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={ms.selectorBtnText}>
              {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.outline} />
          </TouchableOpacity>

          {!isIncome && (
            <>
              <Text style={ms.label}>TRANSACTION STATUS</Text>
              <View style={ms.statusRow}>
                {[
                  { val: 'Paid', label: '✅ Completed / Paid' },
                  { val: 'Pending', label: '⏳ Still Pending' }
                ].map((s) => (
                  <TouchableOpacity
                    key={s.val}
                    onPress={() => setStatus(s.val)}
                    style={[ms.statusBtn, status === s.val && ms.statusBtnActive]}
                  >
                    <Text style={[ms.statusBtnText, status === s.val && ms.statusBtnActiveText]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[ms.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={ms.submitText}>{expense ? 'Update Transaction' : 'Add Transaction'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Categories selector sub-modal */}
        <Modal visible={showCatModal} transparent animationType="slide">
          <View style={ms.overlaySub}>
            <View style={ms.modalContentSub}>
              <View style={ms.modalHeaderSub}>
                <Text style={ms.modalTitleSub}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCatModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.onSurface} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={isIncome ? INCOME_SOURCES : (expense?.type === 'Transfer' ? TRANSFER_CATEGORIES : EXPENSE_CATEGORIES)}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={ms.catItem}
                    onPress={() => {
                      setCategory(item);
                      setShowCatModal(false);
                    }}
                  >
                    <Text style={ms.catItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

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

     // ── Main Screen ───────────────────────────────────────────────────────────────
export default function ExpensesScreen({ navigation }) {
  const { user }                         = useAuth();
  const [expenses,   setExpenses]        = useState([]);
  const [loading,    setLoading]         = useState(true);
  const [refreshing, setRefreshing]      = useState(false);
  const [showForm,    setShowForm]       = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchExpenses = useCallback(async () => {
    try {
      const [expRes, incRes] = await Promise.all([
        expenseService.getExpenses(),
        incomeService.getIncome()
      ]);

      const listExpenses = (expRes.data?.expenses || []).map(e => ({
        ...e,
        type: e.description.startsWith('Transfer:') ? 'Transfer' : 'Expense'
      }));

      const listIncomes = (incRes.data?.incomes || []).map(i => ({
        ...i,
        type: 'Income',
        category: i.source,
        approvalStatus: 'Approved'
      }));

      const merged = [...listExpenses, ...listIncomes].sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(merged);
    } catch (err) {
      console.log('Error fetching unified transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${item.type.toLowerCase()} permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'Income') {
                await incomeService.deleteIncome(item._id);
              } else {
                await expenseService.deleteExpense(item._id);
              }
              fetchExpenses();
              Alert.alert('Deleted', 'Transaction deleted successfully!');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const filtered = expenses.filter((e) =>
    filterStatus === 'All' || e.type === filterStatus
  );

  const renderItem = ({ item }) => {
    const isIncome = item.type === 'Income';
    const amountStr = `${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}`;
    const amountColor = isIncome ? '#006c49' : COLORS.red;
    const showStatus = item.type !== 'Income';
    const sc = STATUS_COLOR[item.approvalStatus] || STATUS_COLOR.Pending;

    return (
      <View style={s.expCard}>
        <View style={s.expTop}>
          <View style={s.expInfo}>
            <Text style={s.expDesc} numberOfLines={1}>{item.description}</Text>
            <Text style={s.expSub}>
              {item.type} • {item.category} • {formatDate(item.date)}
            </Text>
          </View>
          <View style={s.expAmountWrap}>
            <Text style={[s.expAmount, { color: amountColor }]}>{amountStr}</Text>
            {showStatus && (
              <View style={[s.badge, { backgroundColor: sc.bg }]}>
                <Text style={[s.badgeText, { color: sc.text }]}>
                  {item.approvalStatus}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: COLORS.surfaceContainerLow }]}
            onPress={() => handleEdit(item)}>
            <Text style={[s.actionText, { color: COLORS.primary }]}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
            onPress={() => handleDelete(item)}>
            <Text style={[s.actionText, { color: COLORS.red }]}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={s.title}>Transactions</Text>
          <Text style={s.sub}>{expenses.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddTransaction')}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {['All', 'Income', 'Expense', 'Transfer'].map((f) => (
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
            <Text style={s.emptyText}>No transactions found</Text>
          </View>
        }
      />

      <ExpenseFormModal
        visible={showForm}
        expense={editingExpense}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); fetchExpenses(); }}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  closeText:{ fontSize: 14, color: COLORS.onSurface, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  textInput: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background },
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
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white
  },
  methodBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant
  },
  methodBtnActiveText: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  statusBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant
  },
  statusBtnActiveText: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24
  },
  submitText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700'
  },
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
  overlaySub: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  modalContentSub: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%'
  },
  modalHeaderSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant
  },
  modalTitleSub: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface
  },
  catItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194,198,214,0.15)'
  },
  catItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface
  }
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: COLORS.background },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface },
  sub:   { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outlineVariant },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: COLORS.onSurfaceVariant },
  filterTextActive: { color: COLORS.white },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  expCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  expTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expInfo: { flex: 1, marginRight: 10 },
  expDesc: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  expSub:  { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  expAmountWrap: { alignItems: 'flex-end' },
  expAmount: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(194, 198, 214, 0.1)' },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },
});