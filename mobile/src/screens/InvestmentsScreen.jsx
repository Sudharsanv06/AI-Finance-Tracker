import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList, SafeAreaView
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import investmentService from '../services/investmentService';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const TYPES = [
  'SIP', 'FD', 'Stocks', 'Gold', 'PPF',
  'NPS', 'Mutual Fund', 'Real Estate', 'Crypto', 'Other'
];

const TYPE_ICONS = {
  SIP: '🔄',
  FD: '🏦',
  Stocks: '📈',
  Gold: '🥇',
  PPF: '🛡️',
  NPS: '👴',
  'Mutual Fund': '📊',
  'Real Estate': '🏠',
  Crypto: '₿',
  Other: '💼',
};

const PIE_COLORS = [
  '#0058be', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#3b82f6', '#ef4444', '#727785',
  '#006c49', '#825100'
];

export default function InvestmentsScreen({ navigation }) {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'active' | 'matured' | 'withdrawn'

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('SIP');
  const [platform, setPlatform] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [status, setStatus] = useState('active'); // 'active' | 'matured' | 'withdrawn'
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'All') params.type = filterType;
      if (filterStatus !== 'All') params.status = filterStatus;

      const [invRes, sumRes] = await Promise.all([
        investmentService.getInvestments(params),
        investmentService.getSummary()
      ]);

      setInvestments(invRes.data?.investments || []);
      setSummary(sumRes.data || null);
    } catch (err) {
      Alert.alert('Error', 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpenModal = (inv = null) => {
    if (inv) {
      setEditingInvestment(inv);
      setName(inv.name);
      setType(inv.type);
      setPlatform(inv.platform || '');
      setInvestedAmount(String(inv.investedAmount));
      setCurrentValue(String(inv.currentValue || inv.investedAmount));
      setInterestRate(inv.interestRate ? String(inv.interestRate) : '');
      setMonthlyContribution(inv.monthlyContribution ? String(inv.monthlyContribution) : '');
      setStatus(inv.status || 'active');
      setNotes(inv.notes || '');
    } else {
      setEditingInvestment(null);
      setName('');
      setType('SIP');
      setPlatform('');
      setInvestedAmount('');
      setCurrentValue('');
      setInterestRate('');
      setMonthlyContribution('');
      setStatus('active');
      setNotes('');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    if (!investedAmount || isNaN(investedAmount)) return Alert.alert('Error', 'Valid invested amount is required');

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        platform: platform.trim(),
        investedAmount: parseFloat(investedAmount),
        currentValue: parseFloat(currentValue) || parseFloat(investedAmount),
        interestRate: parseFloat(interestRate) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        status,
        notes: notes.trim(),
        startDate: new Date().toISOString()
      };

      if (editingInvestment) {
        await investmentService.updateInvestment(editingInvestment._id, payload);
      } else {
        await investmentService.createInvestment(payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save investment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Investment',
      'Are you sure you want to delete this investment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await investmentService.deleteInvestment(id);
              fetchAll();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete investment');
            }
          }
        }
      ]
    );
  };

  const isProfit = (summary?.totalReturns || 0) >= 0;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Investments</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={s.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} style={s.scrollView}>
        {/* Summary Metric Cards Grid */}
        {summary && (
          <View style={s.summaryGrid}>
            <View style={s.summaryRow}>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>Invested</Text>
                <Text style={s.summaryVal}>{formatCurrency(summary.totalInvested)}</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>Current Value</Text>
                <Text style={s.summaryVal}>{formatCurrency(summary.totalCurrentValue)}</Text>
              </View>
            </View>
            <View style={s.summaryRow}>
              <View style={[s.summaryCard, isProfit ? s.cardProfit : s.cardLoss]}>
                <Text style={[s.summaryLabel, isProfit ? { color: COLORS.green } : { color: COLORS.red }]}>
                  Returns
                </Text>
                <Text style={[s.summaryVal, isProfit ? { color: COLORS.green } : { color: COLORS.red }]}>
                  {isProfit ? '+' : ''}{formatCurrency(summary.totalReturns)}
                </Text>
              </View>
              <View style={[s.summaryCard, isProfit ? s.cardProfit : s.cardLoss]}>
                <Text style={[s.summaryLabel, isProfit ? { color: COLORS.green } : { color: COLORS.red }]}>
                  Returns %
                </Text>
                <Text style={[s.summaryVal, isProfit ? { color: COLORS.green } : { color: COLORS.red }]}>
                  {isProfit ? '+' : ''}{summary.returnsPercent}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Filters Selectors */}
        <View style={s.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
            {['All', ...TYPES].map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.filterPill, filterType === t && s.filterPillActive]}
                onPress={() => setFilterType(t)}
              >
                <Text style={[s.filterPillText, filterType === t && s.filterPillActiveText]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Allocation breakdown */}
        {summary?.byType && Object.keys(summary.byType).length > 0 && filterType === 'All' && (
          <View style={s.allocationCard}>
            <Text style={s.allocationTitle}>Portfolio Allocation</Text>
            {Object.entries(summary.byType).map(([type, val], idx) => {
              const allocationPct = summary.totalCurrentValue > 0
                ? Math.round((val.currentValue / summary.totalCurrentValue) * 100)
                : 0;

              return (
                <View key={type} style={s.allocationRow}>
                  <View style={[s.colorIndicator, { backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }]} />
                  <Text style={s.allocationTypeLabel}>
                    {TYPE_ICONS[type] || '💼'} {type}
                  </Text>
                  <Text style={s.allocationPctText}>{allocationPct}%</Text>
                  <Text style={s.allocationAmtText}>{formatCurrency(val.currentValue)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Investment List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : investments.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📈</Text>
            <Text style={s.emptyTitle}>No investments yet</Text>
            <Text style={s.emptySub}>Start tracking your investment portfolio and returns.</Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={() => handleOpenModal()}>
              <Text style={s.emptyAddText}>+ Add Investment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          investments.map((inv) => {
            const returns = (inv.currentValue || 0) - inv.investedAmount;
            const returnsPercent = inv.investedAmount
              ? ((returns / inv.investedAmount) * 100).toFixed(1)
              : 0;
            const isProfit = returns >= 0;

            return (
              <View key={inv._id} style={s.invCard}>
                <View style={s.invHeader}>
                  <View style={s.invHeaderLeft}>
                    <View style={s.invIcon}>
                      <Text style={{ fontSize: 20 }}>{TYPE_ICONS[inv.type] || '💼'}</Text>
                    </View>
                    <View>
                      <Text style={s.invTitle} numberOfLines={1}>{inv.name}</Text>
                      <Text style={s.invSubText}>
                        {inv.type} {inv.platform ? `• ${inv.platform}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={s.statusBadge}>
                    <Text style={s.statusText}>{inv.status}</Text>
                  </View>
                </View>

                <View style={s.divider} />

                <View style={s.invStatsRow}>
                  <View style={s.invStatCol}>
                    <Text style={s.invStatLabel}>Invested</Text>
                    <Text style={s.invStatVal}>{formatCurrency(inv.investedAmount)}</Text>
                  </View>
                  <View style={s.invStatCol}>
                    <Text style={s.invStatLabel}>Current</Text>
                    <Text style={s.invStatVal}>{formatCurrency(inv.currentValue || 0)}</Text>
                  </View>
                  <View style={s.invStatCol}>
                    <Text style={s.invStatLabel}>Returns</Text>
                    <Text style={[s.invStatVal, isProfit ? { color: COLORS.green } : { color: COLORS.red }]}>
                      {isProfit ? '+' : ''}{returnsPercent}%
                    </Text>
                  </View>
                </View>

                {inv.interestRate > 0 && (
                  <View style={s.invNoteRow}>
                    <Ionicons name="trending-up-outline" size={14} color={COLORS.primary} />
                    <Text style={s.invNoteText}>Interest Rate: {inv.interestRate}% p.a.</Text>
                  </View>
                )}

                <View style={s.invActions}>
                  <TouchableOpacity style={s.invActionBtn} onPress={() => handleOpenModal(inv)}>
                    <Text style={s.invActionText}>Update Value</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.invActionBtn, s.deleteBtn]} onPress={() => handleDelete(inv._id)}>
                    <Text style={[s.invActionText, { color: COLORS.red }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Set/Edit Investment Form Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingInvestment ? 'Edit Investment' : 'Add Investment'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Investment Type Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.inputLabel}>Investment Type</Text>
              <View style={s.categoryGrid}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.categoryGridItem, type === t && s.categoryGridActiveItem]}
                    onPress={() => setType(t)}
                  >
                    <Text style={{ fontSize: 18 }}>{TYPE_ICONS[t]}</Text>
                    <Text style={[s.categoryGridItemText, type === t && { color: COLORS.white }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.inputLabel}>Investment Name</Text>
              <TextInput
                style={s.textInput}
                placeholder="e.g. Nippon India Growth Fund SIP"
                placeholderTextColor={COLORS.outline}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Platform */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.inputLabel}>Platform / Bank</Text>
              <TextInput
                style={s.textInput}
                placeholder="e.g. Zerodha, Groww, HDFC Bank"
                placeholderTextColor={COLORS.outline}
                value={platform}
                onChangeText={setPlatform}
              />
            </View>

            {/* Invested & Current Value */}
            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Invested (₹)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 50000"
                  placeholderTextColor={COLORS.outline}
                  value={investedAmount}
                  onChangeText={setInvestedAmount}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Current Value (₹)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 55000"
                  placeholderTextColor={COLORS.outline}
                  value={currentValue}
                  onChangeText={setCurrentValue}
                />
              </View>
            </View>

            {/* Interest Rate & Monthly SIP */}
            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Interest Rate (%)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 7.1"
                  placeholderTextColor={COLORS.outline}
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Monthly SIP Contribution</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 5000"
                  placeholderTextColor={COLORS.outline}
                  value={monthlyContribution}
                  onChangeText={setMonthlyContribution}
                />
              </View>
            </View>

            {/* Status Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={s.inputLabel}>Status</Text>
              <View style={s.statusSelectorRow}>
                {[
                  { value: 'active', label: 'Active', desc: 'Growing Portfolio' },
                  { value: 'matured', label: 'Matured', desc: 'Target Reached' },
                  { value: 'withdrawn', label: 'Withdrawn', desc: 'Fund Cashed Out' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      s.statusBox,
                      status === item.value ? s.statusBoxActive : s.statusBoxInactive
                    ]}
                    onPress={() => setStatus(item.value)}
                  >
                    <Text style={[
                      s.statusBoxTitle,
                      status === item.value ? s.statusBoxTitleActive : s.statusBoxTitleInactive
                    ]}>
                      {item.label}
                    </Text>
                    <Text style={s.statusBoxDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                <Text style={s.submitBtnText}>Save Investment</Text>
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
  container: { flex: 1, backgroundColor: COLORS.background },
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

  // Summary Metrics
  summaryGrid: {
    marginBottom: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cardProfit: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  cardLoss: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  // Filter Pills
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  filterPillActiveText: {
    color: COLORS.white,
  },

  // Allocation breakdown card
  allocationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
  },
  allocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194, 198, 214, 0.12)',
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  allocationTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  allocationPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    width: 40,
    textAlign: 'right',
  },
  allocationAmtText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
    width: 90,
    textAlign: 'right',
  },

  // Investment card
  invCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
  },
  invHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  invSubText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
    textTransform: 'capitalize',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 10,
  },
  invStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  invStatLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
    fontWeight: '600',
  },
  invStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  invNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  invNoteText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  invActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 8,
    marginTop: 10,
    gap: 8,
  },
  invActionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  invActionText: {
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryGridItem: {
    width: '18%',
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
  statusSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 88, 190, 0.04)',
  },
  statusBoxInactive: {
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
  },
  statusBoxTitle: {
    fontSize: 12,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  statusBoxTitleActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBoxTitleInactive: {
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  statusBoxDesc: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
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
});
