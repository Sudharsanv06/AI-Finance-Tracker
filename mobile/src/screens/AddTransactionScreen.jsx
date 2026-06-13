import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, FlatList, TextInput, ActivityIndicator, Alert,
  SafeAreaView, ScrollView, Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as expenseService from '../services/expenseService';
import * as incomeService from '../services/incomeService';
import api from '../services/api';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Health', 'Education',
  'Utilities', 'Rent', 'Groceries',
  'Travel', 'Personal Care', 'Other'
];

const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Investments',
  'Gifts', 'Refunds', 'Other'
];

const TRANSFER_CATEGORIES = [
  'Bank Transfer', 'Self Transfer', 'Mobile Wallet',
  'Cash Withdrawal', 'Card to Card', 'Other'
];

const CATEGORY_ICONS = {
  // Expenses
  'Food & Dining': '🍽️',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎭',
  'Health': '💊',
  'Education': '📚',
  'Utilities': '💡',
  'Rent': '🏠',
  'Groceries': '🛒',
  'Travel': '✈️',
  'Personal Care': '💆',
  'Other': '📦',
  // Income
  'Salary': '💰',
  'Freelance': '💻',
  'Investments': '📈',
  'Gifts': '🎁',
  'Refunds': '🔄',
  // Transfer
  'Bank Transfer': '🏦',
  'Self Transfer': '🔄',
  'Mobile Wallet': '📱',
  'Cash Withdrawal': '💵',
  'Card to Card': '💳',
};

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

export default function AddTransactionScreen({ navigation, route }) {
  const { user } = useAuth();
  const [balancesConfigured, setBalancesConfigured] = useState(true);

  useEffect(() => {
    const checkBalances = async () => {
      if (user?._id) {
        const stored = await AsyncStorage.getItem(`starting_balances_${user._id}`);
        setBalancesConfigured(!!stored);
      }
    };
    checkBalances();
  }, [user?._id]);

  const [txType, setTxType] = useState('Expense'); // 'Income' | 'Expense' | 'Transfer'
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState('Paid'); // 'Paid' | 'Pending'
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Modals visibility
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events?status=active');
        const activeEvents = res.data?.data?.events || [];
        setEvents(activeEvents);

        // Pre-select if passed in route params
        if (route.params?.eventId) {
          setSelectedEventId(route.params.eventId);
        }
      } catch (err) {
        console.log('Error fetching events:', err);
      }
    };
    fetchEvents();

    if (route.params?.type) {
      setTxType(route.params.type);
    }
  }, [route.params]);

  // Update default category when transaction type changes
  useEffect(() => {
    if (route.params?.category && route.params?.type === txType) {
      setCategory(route.params.category);
      return;
    }
    if (txType === 'Income') {
      setCategory('Salary');
    } else if (txType === 'Expense') {
      setCategory('Other');
    } else {
      setCategory('Bank Transfer');
    }
  }, [txType, route.params]);

  const handleKeyPress = (val) => {
    if (val === 'backspace') {
      if (amount.length <= 1) {
        setAmount('0');
      } else {
        setAmount(amount.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (amount.includes('.')) return;
      setAmount(amount + '.');
      return;
    }

    if (amount === '0') {
      setAmount(val);
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount(amount + val);
    }
  };

  const handleSubmit = async () => {
    if (!balancesConfigured) {
      return Alert.alert(
        'Setup Required',
        'Please set up your starting balances on the Home dashboard first before adding any transactions.',
        [{ text: 'OK' }]
      );
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return Alert.alert('Error', 'Please enter a valid amount');
    }
    if (!description.trim()) {
      return Alert.alert('Error', 'Please enter a description');
    }

    setLoading(true);
    try {
      if (txType === 'Income') {
        await incomeService.createIncome({
          source: category,
          amount: numAmount,
          description: description.trim(),
          date: selectedDate.toISOString()
        });
      } else if (txType === 'Expense') {
        await expenseService.createExpense({
          description: description.trim(),
          amount: numAmount,
          category,
          paymentMethod: 'Cash',
          date: selectedDate.toISOString(),
          approvalStatus: status === 'Paid' ? 'Paid' : 'Pending',
          eventId: selectedEventId || null
        });
      } else {
        // Transfer
        await expenseService.createExpense({
          description: `Transfer: ${description.trim()}`,
          amount: numAmount,
          category,
          paymentMethod: 'Bank Transfer',
          date: selectedDate.toISOString(),
          approvalStatus: status === 'Paid' ? 'Paid' : 'Pending',
          eventId: selectedEventId || null
        });
      }
      Alert.alert('Success', 'Transaction saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = 
    txType === 'Income' ? INCOME_SOURCES : 
    txType === 'Transfer' ? TRANSFER_CATEGORIES : 
    EXPENSE_CATEGORIES;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {!balancesConfigured && (
          <View style={s.warningBanner}>
            <Text style={s.warningBannerText}>
              ⚠️ Starting balances are not configured. Please set them on the Home dashboard first before adding transactions.
            </Text>
          </View>
        )}
        {/* Tab Selector */}
        <View style={s.tabContainer}>
          {['Income', 'Expense', 'Transfer'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTxType(t)}
              style={[s.tabButton, txType === t && s.tabActiveButton]}
            >
              <Text style={[s.tabText, txType === t && s.tabActiveText]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Input Display */}
        <View style={s.amountContainer}>
          <Text style={s.amountLabel}>Amount</Text>
          <Text style={s.amountText}>₹{amount}</Text>
        </View>

        {/* Form Details */}
        <View style={s.formContainer}>
          {/* Category Dropdown Selector */}
          <TouchableOpacity
            style={s.formSelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={s.selectorLeft}>
              <View style={s.iconWrapper}>
                <Text style={{ fontSize: 18 }}>
                  {CATEGORY_ICONS[category] || '📦'}
                </Text>
              </View>
              <Text style={s.selectorLabel}>{category}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.outline} />
          </TouchableOpacity>

          {/* Link to Event Selector (only for Expense) */}
          {txType === 'Expense' && (
            <TouchableOpacity
              style={s.formSelector}
              onPress={() => setShowEventModal(true)}
            >
              <View style={s.selectorLeft}>
                <View style={s.iconWrapper}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={s.selectorLabel} numberOfLines={1}>
                  {selectedEventId
                    ? (events.find(e => e._id === selectedEventId)?.name || 'Linked Event')
                    : 'Link to Event (Optional)'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {selectedEventId && (
                  <TouchableOpacity onPress={() => setSelectedEventId(null)} style={{ marginRight: 10 }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.outline} />
                  </TouchableOpacity>
                )}
                <Ionicons name="chevron-down" size={18} color={COLORS.outline} />
              </View>
            </TouchableOpacity>
          )}

          {/* Date Selector Display */}
          <TouchableOpacity
            style={s.formSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={s.selectorLeft}>
              <View style={s.iconWrapper}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={s.selectorLabel}>
                {selectedDate.toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.outline} />
          </TouchableOpacity>

          {/* Description Text Input */}
          <View style={s.inputWrapper}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={s.inputIcon} />
            <TextInput
              style={s.textInput}
              placeholder="Enter description..."
              placeholderTextColor={COLORS.outline}
              value={description}
              onChangeText={setDescription}
              maxLength={80}
            />
          </View>

          {/* Status Selector (For Expenses and Transfers) */}
          {txType !== 'Income' && (
            <View style={s.statusContainer}>
              <Text style={s.statusLabel}>STATUS</Text>
              <View style={s.statusRow}>
                {[
                  { val: 'Paid', label: '✅ Completed / Paid' },
                  { val: 'Pending', label: '⏳ Still Pending' }
                ].map((st) => (
                  <TouchableOpacity
                    key={st.val}
                    onPress={() => setStatus(st.val)}
                    style={[s.statusBtn, status === st.val && s.statusBtnActive]}
                  >
                    <Text style={[s.statusBtnText, status === st.val && s.statusBtnActiveText]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Numeric Keypad Grid */}
        <View style={s.keypadContainer}>
          <View style={s.keypadRow}>
            {['1', '2', '3'].map((k) => (
              <TouchableOpacity key={k} style={s.keypadKey} onPress={() => handleKeyPress(k)}>
                <Text style={s.keypadKeyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.keypadRow}>
            {['4', '5', '6'].map((k) => (
              <TouchableOpacity key={k} style={s.keypadKey} onPress={() => handleKeyPress(k)}>
                <Text style={s.keypadKeyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.keypadRow}>
            {['7', '8', '9'].map((k) => (
              <TouchableOpacity key={k} style={s.keypadKey} onPress={() => handleKeyPress(k)}>
                <Text style={s.keypadKeyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.keypadRow}>
            <TouchableOpacity style={s.keypadKey} onPress={() => handleKeyPress('.')}>
              <Text style={s.keypadKeyText}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.keypadKey} onPress={() => handleKeyPress('0')}>
              <Text style={s.keypadKeyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.keypadKey} onPress={() => handleKeyPress('backspace')}>
              <Ionicons name="backspace-outline" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={s.submitBtnText}>Add {txType}</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Select Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categoriesList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.modalItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={s.modalItemEmoji}>{CATEGORY_ICONS[item] || '📦'}</Text>
                  <Text style={s.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Event Select Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 14 }}>No active events found</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalItem}
                    onPress={() => {
                      setSelectedEventId(item._id);
                      setShowEventModal(false);
                    }}
                  >
                    <Text style={s.modalItemEmoji}>🎯</Text>
                    <View>
                      <Text style={s.modalItemText}>{item.name}</Text>
                      {item.totalBudget && (
                        <Text style={{ fontSize: 12, color: COLORS.outline, marginTop: 2 }}>
                          Budget: {formatCurrency(item.totalBudget)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Tab selector styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(194, 198, 214, 0.25)',
    borderRadius: 24,
    padding: 4,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActiveButton: {
    backgroundColor: COLORS.onSurface,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  tabActiveText: {
    color: COLORS.white,
  },

  // Amount display
  amountContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  amountLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  // Form wrappers
  formContainer: {
    marginVertical: 10,
    gap: 12,
  },
  formSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  
  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  inputIcon: { marginRight: 12 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
    padding: 0,
  },

  // Status Style
  statusContainer: {
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  statusBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  statusBtnActiveText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Keypad
  keypadContainer: {
    marginVertical: 16,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keypadKey: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Buttons
  submitBtn: {
    backgroundColor: '#0058be',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    shadowColor: '#0058be',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelBtn: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,48,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194, 198, 214, 0.15)',
  },
  modalItemEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  warningBannerText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
