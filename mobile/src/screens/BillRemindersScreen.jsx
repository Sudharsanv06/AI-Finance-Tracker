import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList, SafeAreaView, Switch, Platform, KeyboardAvoidingView
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import billService from '../services/billService';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sendLocalNotification, scheduleBillReminder } from '../services/notificationService';

const BILL_CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Internet',
  'Phone', 'Insurance', 'Subscription',
  'EMI', 'Gas', 'Credit Card', 'Other'
];

const CATEGORY_ICONS = {
  'Rent': 'home-outline',
  'Electricity': 'bulb-outline',
  'Water': 'water-outline',
  'Internet': 'wifi-outline',
  'Phone': 'phone-portrait-outline',
  'Insurance': 'shield-checkmark-outline',
  'Subscription': 'tv-outline',
  'EMI': 'card-outline',
  'Gas': 'flame-outline',
  'Credit Card': 'cash-outline',
  'Other': 'document-text-outline',
};

const PAYMENT_METHODS = [
  { key: 'Cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'Credit Card', label: 'Credit Card', icon: 'card-outline' },
  { key: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { key: 'Bank Transfer', label: 'Net Banking / Bank Transfer', icon: 'business-outline' },
  { key: 'Cheque', label: 'Cheque', icon: 'document-text-outline' },
  { key: 'Other', label: 'Other / Wallet', icon: 'wallet-outline' },
];

const UPI_QUICK_PICKS = [
  'GPay', 'PhonePe', 'BHIM UPI', 'Amazon Pay UPI', 'Navi UPI', 'Supermoney UPI',
];

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BillRemindersScreen({ navigation }) {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'unpaid' | 'paid' | 'urgent'

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [dueDate, setDueDate] = useState('1'); // day of month
  const [dueMonth, setDueMonth] = useState(String(new Date().getMonth() + 1)); // 1-12, used for quarterly/yearly anchor
  const [isRecurring, setIsRecurring] = useState(true);
  const [frequency, setFrequency] = useState('monthly');
  const [autoPay, setAutoPay] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [customDetail, setCustomDetail] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billService.getBills();
      setBills(res.data?.bills || []);
      setSummary({
        totalMonthly: res.data?.totalMonthly || 0,
        unpaidThisMonth: res.data?.unpaidThisMonth || 0,
        upcomingIn7Days: res.data?.upcomingIn7Days || 0,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        if (isActive) await fetchAll();
      };
      load();
      return () => { isActive = false; };
    }, [fetchAll])
  );

  const handleOpenModal = (bill = null) => {
    if (bill) {
      setEditingBill(bill);
      setTitle(bill.title);
      setAmount(String(bill.amount));
      setCategory(bill.category);
      setDueDate(String(bill.dueDate));
      setDueMonth(String(bill.dueMonth || new Date().getMonth() + 1));
      setIsRecurring(bill.isRecurring !== false);
      setFrequency(bill.frequency || 'monthly');
      setAutoPay(bill.autoPay || false);
      setNotes(bill.notes || '');
      setPaymentMethod(bill.paymentMethod || null);
      setPaymentDetail(bill.paymentDetail || '');
    } else {
      setEditingBill(null);
      setTitle('');
      setAmount('');
      setCategory('Other');
      setDueDate('1');
      setDueMonth(String(new Date().getMonth() + 1));
      setIsRecurring(true);
      setFrequency('monthly');
      setAutoPay(false);
      setNotes('');
      setPaymentMethod(null);
      setPaymentDetail('');
    }
    setCustomDetail('');
    setShowModal(true);
  };

  const handleTogglePaid = async (bill) => {
    try {
      if (!bill.isDueThisMonth || bill.isPaid) {
        await billService.markUnpaid(bill._id);
      } else {
        await billService.markPaid(bill._id);
      }
      fetchAll();
    } catch (err) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  // Computed preview of when this bill will actually be due, based on
  // frequency + the chosen day (and month, for quarterly/yearly).
  const getOccurrencePreview = () => {
    const day = parseInt(dueDate) || 1;
    const startMonth = parseInt(dueMonth) || 1;

    if (frequency === 'monthly') {
      return `Every month on day ${day}`;
    }
    if (frequency === 'yearly') {
      return `Once a year — ${MONTH_NAMES_SHORT[startMonth - 1]} ${day}`;
    }
    // quarterly — 4 occurrences a year, every 3 months from the chosen month
    const dates = [];
    for (let i = 0; i < 4; i++) {
      const m = ((startMonth - 1 + i * 3) % 12) + 1;
      dates.push(`${MONTH_NAMES_SHORT[m - 1]} ${day}`);
    }
    return `4 times a year — ${dates.join(', ')}`;
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!amount || isNaN(amount)) return Alert.alert('Error', 'Valid amount is required');
    if (!paymentMethod) return Alert.alert('Error', 'Please select a payment method');

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: parseInt(dueDate),
        dueMonth: frequency === 'monthly' ? undefined : parseInt(dueMonth),
        isRecurring,
        frequency,
        autoPay,
        paymentMethod,
        paymentDetail: paymentDetail || undefined,
        notes: paymentDetail
          ? `${notes.trim()}${notes.trim() ? ' · ' : ''}Paid via ${paymentDetail}`.trim()
          : notes.trim()
      };

      if (editingBill) {
        await billService.updateBill(editingBill._id, payload);
      } else {
        await billService.createBill(payload);
        await sendLocalNotification(
          'Bill Reminder Created',
          `Reminder for "${payload.title}" of ₹${payload.amount} has been added.`
        );
        await scheduleBillReminder(payload.title, payload.amount, 3);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save bill reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await billService.deleteBill(id);
              fetchAll();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete bill');
            }
          }
        }
      ]
    );
  };

  const filteredBills = bills.filter((b) => {
    if (filterStatus === 'paid') return !b.isDueThisMonth || b.isPaid;
    if (filterStatus === 'unpaid') return b.isDueThisMonth && !b.isPaid;
    if (filterStatus === 'urgent') return b.isDueThisMonth && !b.isPaid && b.daysUntilDue <= 7;
    return true;
  });

  const selectedPayment = PAYMENT_METHODS.find(p => p.key === paymentMethod);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bills & Reminders</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={s.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} style={s.scrollView}>
        {/* Summary Metric Cards */}
        {summary && (
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Monthly Total</Text>
              <Text style={s.metricVal}>{formatCurrency(summary.totalMonthly)}</Text>
            </View>
            <View style={[s.metricCard, summary.unpaidThisMonth > 0 && s.metricCardWarning]}>
              <Text style={[s.metricLabel, summary.unpaidThisMonth > 0 && { color: '#b45309' }]}>Unpaid</Text>
              <Text style={[s.metricVal, summary.unpaidThisMonth > 0 && { color: '#b45309' }]}>{summary.unpaidThisMonth}</Text>
            </View>
            <View style={[s.metricCard, summary.upcomingIn7Days > 0 && s.metricCardDanger]}>
              <Text style={[s.metricLabel, summary.upcomingIn7Days > 0 && { color: COLORS.red }]}>Urgent (7d)</Text>
              <Text style={[s.metricVal, summary.upcomingIn7Days > 0 && { color: COLORS.red }]}>{summary.upcomingIn7Days}</Text>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={s.filterRow}>
          {[
            { val: 'All', label: 'All', icon: null },
            { val: 'unpaid', label: 'Unpaid', icon: 'time-outline' },
            { val: 'paid', label: 'Paid', icon: 'checkmark-circle-outline' },
            { val: 'urgent', label: 'Urgent', icon: 'warning-outline' }
          ].map((f) => (
            <TouchableOpacity
              key={f.val}
              style={[s.filterBtn, filterStatus === f.val && s.filterBtnActive, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }]}
              onPress={() => setFilterStatus(f.val)}
            >
              {f.icon && (
                <Ionicons
                  name={f.icon}
                  size={12}
                  color={filterStatus === f.val ? COLORS.white : COLORS.onSurfaceVariant}
                />
              )}
              <Text style={[s.filterBtnText, filterStatus === f.val && s.filterBtnActiveText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bills list */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filteredBills.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.outline} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>No bills found</Text>
            <Text style={s.emptySub}>Add your recurring bills to get timely reminders.</Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={() => handleOpenModal()}>
              <Text style={s.emptyAddText}>+ Add First Bill</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBills.map((b) => {
            const isDueThisMonth = b.isDueThisMonth;
            const daysUntilDue = b.daysUntilDue;
            const isUrgent = isDueThisMonth && daysUntilDue <= 3 && !b.isPaid;
            const isUpcoming = isDueThisMonth && daysUntilDue <= 7 && !b.isPaid;
            const isPaid = !isDueThisMonth || b.isPaid;

            const iconBg = isPaid ? 'rgba(16, 185, 129, 0.08)' : isUrgent ? 'rgba(239, 68, 68, 0.08)' : isUpcoming ? 'rgba(217, 119, 6, 0.08)' : COLORS.surfaceContainerLow;

            return (
              <View key={b._id} style={[s.billCard, isUrgent && s.billCardUrgent, isUpcoming && s.billCardUpcoming]}>
                <View style={s.billCardMain}>
                  <View style={[s.billIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={CATEGORY_ICONS[b.category] || 'document-text-outline'} size={20} color={COLORS.primary} />
                  </View>

                  <View style={s.billDetails}>
                    <View style={s.titleRow}>
                      <Text style={s.billTitle} numberOfLines={1}>{b.title}</Text>
                      {b.autoPay && <View style={s.autoPayTag}><Text style={s.autoPayText}>AUTO</Text></View>}
                    </View>
                    <Text style={s.billDateText}>
                      Due day {b.dueDate} • {b.frequency}
                      {b.paymentMethod ? ` • ${b.paymentMethod}` : ''}
                    </Text>
                    {isDueThisMonth && !isPaid && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <Ionicons
                          name={isUrgent ? 'alert-circle' : 'warning-outline'}
                          size={11}
                          color={isUrgent ? COLORS.red : '#d97706'}
                        />
                        <Text style={[s.alertText, isUrgent && { color: COLORS.red }]}>
                          {isUrgent ? 'Due soon!' : `${daysUntilDue} days left`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={s.billAmountCol}>
                    <Text style={s.billAmountText}>{formatCurrency(b.amount)}</Text>
                    <Text style={[s.billStatusText, isPaid ? { color: COLORS.green } : { color: '#d97706' }]}>
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>

                <View style={s.billActions}>
                  <TouchableOpacity
                    style={[s.billActionBtn, isPaid ? s.unpayBtn : s.payBtn]}
                    onPress={() => handleTogglePaid(b)}
                  >
                    <Text style={[s.billActionText, isPaid ? { color: '#d97706' } : { color: COLORS.green }]}>
                      {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.billActionEdit} onPress={() => handleOpenModal(b)}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.billActionDelete} onPress={() => handleDelete(b._id)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Set/Edit Bill Form Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingBill ? 'Edit Bill' : 'Add Bill Reminder'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Category Select Grid */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.inputLabel}>Category</Text>
                <View style={s.categoryGrid}>
                  {BILL_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.categoryGridItem, category === c && s.categoryGridActiveItem]}
                      onPress={() => setCategory(c)}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[c]}
                        size={18}
                        color={category === c ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[s.categoryGridItemText, category === c && { color: COLORS.white }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bill Title */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.inputLabel}>Bill Title</Text>
                <TextInput
                  style={[
                    s.textInput,
                    focusedField === 'title' && s.inputFocused
                  ]}
                  placeholder="e.g. Broadband internet"
                  placeholderTextColor={COLORS.outline}
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  cursorColor={COLORS.teal}
                  selectionColor={COLORS.teal + '40'}
                />
              </View>

              {/* Amount & Due Date Day */}
              <View style={s.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Amount (₹)</Text>
                  <TextInput
                    style={[
                      s.textInput,
                      focusedField === 'amount' && s.inputFocused
                    ]}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 999"
                    placeholderTextColor={COLORS.outline}
                    value={amount === '' ? '' : String(amount)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      const formatted = parts.length > 2
                        ? parts[0] + '.' + parts.slice(1).join('')
                        : cleaned;
                      setAmount(formatted);
                    }}
                    returnKeyType="done"
                    autoCorrect={false}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => setFocusedField(null)}
                    cursorColor={COLORS.teal}
                    selectionColor={COLORS.teal + '40'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Due on Day (1-28)</Text>
                  <TextInput
                    style={[
                      s.textInput,
                      focusedField === 'dueDate' && s.inputFocused
                    ]}
                    keyboardType="number-pad"
                    placeholder="e.g. 15"
                    placeholderTextColor={COLORS.outline}
                    value={dueDate === '' ? '' : String(dueDate)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      setDueDate(cleaned);
                    }}
                    returnKeyType="done"
                    autoCorrect={false}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    onFocus={() => setFocusedField('dueDate')}
                    onBlur={() => setFocusedField(null)}
                    cursorColor={COLORS.teal}
                    selectionColor={COLORS.teal + '40'}
                  />
                </View>
              </View>

              {/* Frequency Select */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.inputLabel}>Frequency</Text>
                <View style={s.freqRow}>
                  {['monthly', 'quarterly', 'yearly'].map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[s.freqBtn, frequency === f && s.freqBtnActive]}
                      onPress={() => setFrequency(f)}
                    >
                      <Text style={[s.freqText, frequency === f && { color: COLORS.white }]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Month Select — only needed for quarterly/yearly */}
              {frequency !== 'monthly' && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={s.inputLabel}>
                    {frequency === 'yearly' ? 'Month it falls due' : 'Starting month (quarter anchor)'}
                  </Text>
                  <View style={s.monthGrid}>
                    {MONTH_NAMES_SHORT.map((m, idx) => {
                      const val = String(idx + 1);
                      const active = dueMonth === val;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[s.monthChip, active && s.monthChipActive]}
                          onPress={() => setDueMonth(val)}
                        >
                          <Text style={[s.monthChipText, active && { color: COLORS.white }]}>{m}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Computed due-date preview */}
              <View style={s.previewBox}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                <Text style={s.previewText}>{getOccurrencePreview()}</Text>
              </View>

              {/* Payment Method Selector */}
              <View style={{ marginTop: 16, marginBottom: 16 }}>
                <Text style={s.inputLabel}>Payment Method</Text>
                <TouchableOpacity style={s.paymentSelector} onPress={() => setShowPaymentModal(true)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={selectedPayment?.icon || 'wallet-outline'} size={18} color={COLORS.primary} />
                    <Text style={s.selectorLabel} numberOfLines={1}>
                      {selectedPayment
                        ? `${selectedPayment.label}${paymentDetail ? ' · ' + paymentDetail : ''}`
                        : 'Select Payment Method'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={COLORS.outline} />
                </TouchableOpacity>
              </View>

              {/* Auto Pay Checkbox */}
              <View style={s.switchRow}>
                <View>
                  <Text style={s.switchTitle}>Auto Pay Enabled</Text>
                  <Text style={s.switchSub}>App marks this bill as auto-paid on due date</Text>
                </View>
                <Switch
                  value={autoPay}
                  onValueChange={setAutoPay}
                  trackColor={{ false: COLORS.outlineVariant, true: COLORS.primary }}
                />
              </View>

              {/* Notes */}
              <View style={{ marginBottom: 24, marginTop: 16 }}>
                <Text style={s.inputLabel}>Notes</Text>
                <TextInput
                  style={[
                    s.textInput,
                    focusedField === 'notes' && s.inputFocused
                  ]}
                  placeholder="Add optional notes..."
                  placeholderTextColor={COLORS.outline}
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                  cursorColor={COLORS.teal}
                  selectionColor={COLORS.teal + '40'}
                />
              </View>
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: StyleSheet.hairlineWidth, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.white }}>
              <TouchableOpacity style={s.submitBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={s.submitBtnText}>Save Bill Reminder</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Payment Method Select Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaymentModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PAYMENT_METHODS}
            keyExtractor={(item) => item.key}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.modalPickerItem}
                onPress={() => {
                  setPaymentMethod(item.key);
                  setPaymentDetail('');
                  setCustomDetail('');
                  if (item.key === 'UPI') {
                    setShowPaymentModal(false);
                    setShowUpiModal(true);
                  } else {
                    setShowPaymentModal(false);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                  <Text style={s.modalPickerItemText}>{item.label}</Text>
                </View>
                {paymentMethod === item.key && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowPaymentModal(false)}>
                <Text style={s.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* UPI Selection Modal */}
      <Modal visible={showUpiModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowUpiModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select UPI App</Text>
            <TouchableOpacity onPress={() => setShowUpiModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {UPI_QUICK_PICKS.map((app) => (
                  <TouchableOpacity
                    key={app}
                    onPress={() => {
                      setPaymentDetail(app);
                      setShowUpiModal(false);
                    }}
                    style={[
                      s.freqBtn,
                      { flex: 0, paddingHorizontal: 16 },
                      paymentDetail === app && s.freqBtnActive,
                    ]}
                  >
                    <Text style={[s.freqText, { textTransform: 'none' }, paymentDetail === app && { color: COLORS.white }]}>
                      {app}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.inputLabel}>OTHER UPI APP / ACCOUNT</Text>
              <TextInput
                style={[s.textInput, { marginTop: 6 }]}
                placeholder="e.g. Paytm UPI, IDFC UPI..."
                placeholderTextColor={COLORS.outline}
                value={customDetail}
                onChangeText={setCustomDetail}
              />
              <TouchableOpacity
                style={[s.submitBtn, { marginTop: 16 }]}
                onPress={() => {
                  if (customDetail.trim()) setPaymentDetail(customDetail.trim());
                  setShowUpiModal(false);
                }}
              >
                <Text style={s.submitBtnText}>Confirm</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  scrollView: { flex: 1 },
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
  addBtn: { padding: 4 },
  content: { padding: 16, paddingBottom: 120 },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  metricCardWarning: {
    borderColor: 'rgba(217, 119, 6, 0.25)',
    backgroundColor: 'rgba(217, 119, 6, 0.02)',
  },
  metricCardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  filterBtnActiveText: {
    color: COLORS.white,
  },

  // Bill Card
  billCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
  },
  billCardUrgent: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  billCardUpcoming: {
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  billCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  autoPayTag: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  autoPayText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
  },
  billDateText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  alertText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    marginTop: 2,
  },
  billAmountCol: {
    alignItems: 'flex-end',
  },
  billAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  billStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  billActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 8,
    marginTop: 10,
    gap: 8,
  },
  billActionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  unpayBtn: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  billActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  billActionEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billActionDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#0058be',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyAddText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  freqBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  freqText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 16,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  switchSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#0058be',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryGridItem: {
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  categoryGridActiveItem: {
    backgroundColor: COLORS.onSurface,
    borderColor: COLORS.onSurface,
  },
  categoryGridItemText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: COLORS.teal,
    borderWidth: 2,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthChip: {
    width: '15%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  monthChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  modalPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194, 198, 214, 0.15)',
  },
  modalPickerItemText: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  modalCloseBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
