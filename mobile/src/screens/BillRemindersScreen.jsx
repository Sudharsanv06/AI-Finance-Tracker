import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList, SafeAreaView, Switch, Platform
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import billService from '../services/billService';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const BILL_CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Internet',
  'Phone', 'Insurance', 'Subscription',
  'EMI', 'Gas', 'Credit Card', 'Other'
];

const CATEGORY_ICONS = {
  'Rent': '🏠',
  'Electricity': '💡',
  'Water': '💧',
  'Internet': '📶',
  'Phone': '📱',
  'Insurance': '🛡️',
  'Subscription': '📺',
  'EMI': '💳',
  'Gas': '🔥',
  'Credit Card': '💰',
  'Other': '📄',
};

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
  const [isRecurring, setIsRecurring] = useState(true);
  const [frequency, setFrequency] = useState('monthly');
  const [autoPay, setAutoPay] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBills = useCallback(async () => {
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

  const hasFetched = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      fetchBills();
      return () => {
        hasFetched.current = false;
      };
    }, [fetchBills])
  );

  const handleOpenModal = (bill = null) => {
    if (bill) {
      setEditingBill(bill);
      setTitle(bill.title);
      setAmount(String(bill.amount));
      setCategory(bill.category);
      setDueDate(String(bill.dueDate));
      setIsRecurring(bill.isRecurring !== false);
      setFrequency(bill.frequency || 'monthly');
      setAutoPay(bill.autoPay || false);
      setNotes(bill.notes || '');
    } else {
      setEditingBill(null);
      setTitle('');
      setAmount('');
      setCategory('Other');
      setDueDate('1');
      setIsRecurring(true);
      setFrequency('monthly');
      setAutoPay(false);
      setNotes('');
    }
    setShowModal(true);
  };

  const handleTogglePaid = async (bill) => {
    try {
      if (!bill.isDueThisMonth || bill.isPaid) {
        await billService.markUnpaid(bill._id);
      } else {
        await billService.markPaid(bill._id);
      }
      fetchBills();
    } catch (err) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!amount || isNaN(amount)) return Alert.alert('Error', 'Valid amount is required');

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: parseInt(dueDate),
        isRecurring,
        frequency,
        autoPay,
        notes: notes.trim()
      };

      if (editingBill) {
        await billService.updateBill(editingBill._id, payload);
      } else {
        await billService.createBill(payload);
      }
      setShowModal(false);
      fetchBills();
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
              fetchBills();
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
            { val: 'All', label: 'All' },
            { val: 'unpaid', label: '⏳ Unpaid' },
            { val: 'paid', label: '✅ Paid' },
            { val: 'urgent', label: '⚠️ Urgent' }
          ].map((f) => (
            <TouchableOpacity
              key={f.val}
              style={[s.filterBtn, filterStatus === f.val && s.filterBtnActive]}
              onPress={() => setFilterStatus(f.val)}
            >
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
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📄</Text>
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
                    <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[b.category] || '📄'}</Text>
                  </View>

                  <View style={s.billDetails}>
                    <View style={s.titleRow}>
                      <Text style={s.billTitle} numberOfLines={1}>{b.title}</Text>
                      {b.autoPay && <View style={s.autoPayTag}><Text style={s.autoPayText}>AUTO</Text></View>}
                    </View>
                    <Text style={s.billDateText}>
                      Due day {b.dueDate} • {b.frequency}
                    </Text>
                    {isDueThisMonth && !isPaid && (
                      <Text style={[s.alertText, isUrgent && { color: COLORS.red }]}>
                        {isUrgent ? '🚨 Due soon!' : `⚠️ ${daysUntilDue} days left`}
                      </Text>
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
      </ScrollView>

      {/* Set/Edit Bill Form Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingBill ? 'Edit Bill' : 'Add Bill Reminder'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
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
                    <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[c]}</Text>
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
                style={s.textInput}
                placeholder="e.g. Broadband internet"
                placeholderTextColor={COLORS.outline}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount & Due Date Day */}
            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 999"
                  placeholderTextColor={COLORS.outline}
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Due on Day (1-28)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 15"
                  placeholderTextColor={COLORS.outline}
                  value={dueDate}
                  onChangeText={setDueDate}
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
            <View style={{ marginBottom: 24 }}>
              <Text style={s.inputLabel}>Notes</Text>
              <TextInput
                style={s.textInput}
                placeholder="Add optional notes..."
                placeholderTextColor={COLORS.outline}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={s.submitBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={s.submitBtnText}>Save Bill Reminder</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  content: { padding: 16, paddingBottom: 40 },

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
});
