import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList, SafeAreaView, Platform
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import budgetService from '../services/budgetService';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Health', 'Education',
  'Utilities', 'Rent', 'Groceries',
  'Travel', 'Personal Care', 'Other'
];

const CATEGORY_ICONS = {
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
  'Other': '📦'
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PickerModal({ visible, onClose, title, items, selectedValue, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            style={{ maxHeight: 280, paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  s.modalPickerItem,
                  selectedValue === item.value && { backgroundColor: COLORS.surfaceContainerLow }
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  s.modalPickerItemText,
                  selectedValue === item.value && { fontWeight: '700', color: COLORS.primary }
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose}>
            <Text style={s.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function BudgetPlannerScreen({ navigation }) {
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Picker modal visibility states
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState('Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertAt, setAlertAt] = useState('80');
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetService.getBudgets(selectedMonth, selectedYear);
      // Map API correctly using res.data
      setBudgets(res.data?.budgets || []);
      setSummary({
        totalLimit: res.data?.totalLimit || 0,
        totalSpent: res.data?.totalSpent || 0,
        alerts: res.data?.alerts || 0,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setCategory(budget.category);
      setMonthlyLimit(String(budget.monthlyLimit));
      setAlertAt(String(budget.alertAt || 80));
    } else {
      setEditingBudget(null);
      setCategory('Food & Dining');
      setMonthlyLimit('');
      setAlertAt('80');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!monthlyLimit || isNaN(monthlyLimit)) {
      return Alert.alert('Error', 'Please enter a valid monthly limit');
    }

    setSaving(true);
    try {
      const payload = {
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        alertAt: parseInt(alertAt),
        month: selectedMonth,
        year: selectedYear,
      };

      if (editingBudget) {
        await budgetService.updateBudget(editingBudget._id, payload);
      } else {
        await budgetService.createBudget(payload);
      }
      setShowModal(false);
      fetchBudgets();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetService.deleteBudget(id);
              fetchBudgets();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          }
        }
      ]
    );
  };

  const totalPct = summary?.totalLimit
    ? Math.min(Math.round((summary.totalSpent / summary.totalLimit) * 100), 100)
    : 0;

  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i + 1 }));
  const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030].map((y) => ({
    label: String(y),
    value: y,
  }));

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Budget Planner</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={s.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} style={s.scrollView}>
        {/* Month Selector Dropdowns */}
        <View style={s.selectorRow}>
          <View style={s.pickerWrapper}>
            <Text style={s.pickerLabel}>Month</Text>
            <TouchableOpacity 
              style={s.pickerBtn} 
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={s.pickerText}>{MONTHS[selectedMonth - 1]}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
          <View style={s.pickerWrapper}>
            <Text style={s.pickerLabel}>Year</Text>
            <TouchableOpacity 
              style={s.pickerBtn} 
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={s.pickerText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overall summary progress card */}
        {summary && budgets.length > 0 && (
          <View style={[s.card, totalPct >= 90 && s.cardDanger]}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Overall Budget Progress</Text>
              <Text style={[s.cardPctText, totalPct >= 90 && { color: COLORS.red }]}>
                {totalPct}%
              </Text>
            </View>
            <View style={s.progressBarTrack}>
              <View style={[
                s.progressBarFill, 
                { width: `${totalPct}%` },
                totalPct >= 90 && { backgroundColor: COLORS.red }
              ]} />
            </View>
            <View style={s.statsGrid}>
              <View style={s.statCol}>
                <Text style={s.statLabel}>Limit</Text>
                <Text style={s.statVal}>{formatCurrency(summary.totalLimit)}</Text>
              </View>
              <View style={s.statCol}>
                <Text style={s.statLabel}>Spent</Text>
                <Text style={s.statVal}>{formatCurrency(summary.totalSpent)}</Text>
              </View>
              <View style={s.statCol}>
                <Text style={s.statLabel}>Left</Text>
                <Text style={[s.statVal, { color: COLORS.green }]}>
                  {formatCurrency(Math.max(0, summary.totalLimit - summary.totalSpent))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Budgets Grid/List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : budgets.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
            <Text style={s.emptyTitle}>No budgets configured</Text>
            <Text style={s.emptySub}>Set a monthly spending limit for event categories.</Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={() => handleOpenModal()}>
              <Text style={s.emptyAddText}>+ Set Budget Limit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((b) => {
            const pct = b.utilization || 0;
            const isOver = b.isOver;
            const isAlert = b.needsAlert;
            const barFillColor = isOver ? COLORS.red : isAlert ? '#d97706' : COLORS.primary;

            return (
              <View key={b._id} style={s.budgetCard}>
                <View style={s.budgetHeader}>
                  <View style={s.budgetHeaderLeft}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>
                      {CATEGORY_ICONS[b.category] || '📦'}
                    </Text>
                    <View>
                      <Text style={s.budgetCategoryName}>{b.category}</Text>
                      {isOver && <Text style={s.alertBadgeText}>🚨 Over Budget!</Text>}
                      {!isOver && isAlert && <Text style={[s.alertBadgeText, { color: '#d97706' }]}>⚠️ Nearing Limit</Text>}
                    </View>
                  </View>
                  <Text style={[s.budgetCardPct, { color: barFillColor }]}>{pct}%</Text>
                </View>

                <View style={[s.progressBarTrack, { height: 6, marginVertical: 8 }]}>
                  <View style={[s.progressBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barFillColor }]} />
                </View>

                <View style={s.budgetRowStats}>
                  <Text style={s.budgetStatsRowText}>
                    Spent {formatCurrency(b.spent || 0)} of {formatCurrency(b.monthlyLimit)}
                  </Text>
                </View>

                <View style={s.budgetActions}>
                  <TouchableOpacity 
                    style={[s.actionBtn, { backgroundColor: 'rgba(0, 108, 73, 0.05)' }]} 
                    onPress={() => navigation.navigate('AddTransaction', { category: b.category, type: 'Expense' })}
                  >
                    <Text style={[s.actionBtnText, { color: COLORS.green }]}>+ Add Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleOpenModal(b)}>
                    <Text style={s.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.deleteActionBtn]} onPress={() => handleDelete(b._id)}>
                    <Text style={[s.actionBtnText, { color: COLORS.red }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Month Picker Modal */}
      <PickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        title="Select Month"
        items={monthOptions}
        selectedValue={selectedMonth}
        onSelect={setSelectedMonth}
      />

      {/* Year Picker Modal */}
      <PickerModal
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        title="Select Year"
        items={yearOptions}
        selectedValue={selectedYear}
        onSelect={setSelectedYear}
      />

      {/* Set/Edit Budget Form Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingBudget ? 'Edit Budget' : 'Set Budget'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Category Select Grid */}
            {!editingBudget && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.inputLabel}>Category</Text>
                <View style={s.categoryGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.categoryGridItem, category === c && s.categoryGridActiveItem]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[c]}</Text>
                      <Text style={[s.categoryGridItemText, category === c && { color: COLORS.white }]}>
                        {c.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Limit Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.inputLabel}>Monthly Limit (₹)</Text>
              <TextInput
                style={s.textInput}
                keyboardType="numeric"
                placeholder="e.g. 10000"
                placeholderTextColor={COLORS.outline}
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
              />
            </View>

            {/* Alert percentage */}
            <View style={{ marginBottom: 24 }}>
              <Text style={s.inputLabel}>Alert Percentage (%)</Text>
              <TextInput
                style={s.textInput}
                keyboardType="numeric"
                placeholder="e.g. 80"
                placeholderTextColor={COLORS.outline}
                value={alertAt}
                onChangeText={setAlertAt}
              />
              <Text style={s.tipText}>
                You will be notified when spending reaches this percent.
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={s.submitBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={s.submitBtnText}>Save Budget Limit</Text>
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
  content: { padding: 20, paddingBottom: 40 },
  
  // Selector row styles
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardPctText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Budget Card
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.red,
    marginTop: 2,
  },
  budgetCardPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  budgetRowStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetStatsRowText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  budgetActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 8,
    marginTop: 4,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
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
  tipText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    fontStyle: 'italic',
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
    width: '31%',
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
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },

  // Modal Custom Styling (Android compatible)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,48,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  modalPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
