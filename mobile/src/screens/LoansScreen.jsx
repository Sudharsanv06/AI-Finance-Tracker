import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as loanService from '../services/loanService';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

function AddLoanModal({ visible, onClose, onSaved }) {
  const [title,         setTitle]         = useState('');
  const [type,          setType]          = useState('taken');
  const [loanFrom,      setLoanFrom]      = useState('');
  const [principal,     setPrincipal]     = useState('');
  const [interestRate,  setInterestRate]  = useState('');
  const [tenureMonths,  setTenureMonths]  = useState('12');
  const [loading,       setLoading]       = useState(false);

  const calcEMI = () => {
    if (!principal || !tenureMonths) return 0;
    const p = parseFloat(principal);
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(tenureMonths);
    if (!r) return Math.round(p / n);
    const rate = r / 12 / 100;
    return Math.round((p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !principal) return Alert.alert('Error', 'Title and principal required');
    setLoading(true);
    try {
      await loanService.createLoan({
        title, type, loanFrom, principal: parseFloat(principal),
        interestRate: parseFloat(interestRate) || 0,
        tenureMonths: parseInt(tenureMonths) || 12,
      });
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const emi = calcEMI();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>Add Loan</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={ms.label}>TYPE</Text>
          <View style={ms.typeRow}>
            {[
              { val: 'taken', label: '⬇️ Loan Taken', desc: 'I borrowed' },
              { val: 'given', label: '⬆️ Loan Given', desc: 'I lent' },
            ].map((t) => (
              <TouchableOpacity key={t.val} onPress={() => setType(t.val)}
                style={[ms.typeBtn, type === t.val && ms.typeBtnActive]}>
                <Text style={ms.typeBtnLabel}>{t.label}</Text>
                <Text style={ms.typeBtnDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ms.label}>TITLE</Text>
          <TextInput style={ms.input} value={title} onChangeText={setTitle}
            placeholder="e.g. Home loan from SBI" placeholderTextColor={COLORS.outline} />

          <Text style={ms.label}>{type === 'taken' ? 'BORROWED FROM' : 'LENT TO'}</Text>
          <TextInput style={ms.input} value={loanFrom} onChangeText={setLoanFrom}
            placeholder={type === 'taken' ? 'e.g. SBI Bank' : 'e.g. Ravi'} placeholderTextColor={COLORS.outline} />

          <Text style={ms.label}>PRINCIPAL (₹)</Text>
          <TextInput style={ms.input} value={principal} onChangeText={setPrincipal}
            placeholder="500000" placeholderTextColor={COLORS.outline} keyboardType="numeric" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={ms.label}>INTEREST RATE (%)</Text>
              <TextInput style={ms.input} value={interestRate} onChangeText={setInterestRate}
                placeholder="8.5" placeholderTextColor={COLORS.outline} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ms.label}>TENURE (MONTHS)</Text>
              <TextInput style={ms.input} value={tenureMonths} onChangeText={setTenureMonths}
                placeholder="24" placeholderTextColor={COLORS.outline} keyboardType="numeric" />
            </View>
          </View>

          {emi > 0 && principal && (
            <View style={ms.emiPreview}>
              <Text style={ms.emiLabel}>Estimated Monthly EMI</Text>
              <Text style={ms.emiValue}>{formatCurrency(emi)}</Text>
            </View>
          )}

          <TouchableOpacity style={[ms.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={ms.submitText}>+ Add Loan</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function RepaymentModal({ visible, onClose, onPay, loan }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loan) {
      setAmount(String(loan.emiAmount || ''));
    }
  }, [loan]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return Alert.alert('Error', 'Please enter a valid positive amount.');
    }
    setLoading(true);
    try {
      await onPay(loan, parsedAmount);
      setAmount('');
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Record Repayment</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtnHeader}>
              <Ionicons name="close" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <Text style={s.modalSub}>EMI Amount: {formatCurrency(loan?.emiAmount || 0)}</Text>
            
            <Text style={s.modalLabel}>REPAYMENT AMOUNT (₹)</Text>
            <TextInput
              style={s.modalInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 5000"
              placeholderTextColor={COLORS.outline}
              keyboardType="numeric"
              autoFocus
            />

            <TouchableOpacity style={[s.modalSubmitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.modalSubmitBtnText}>Record Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose}>
              <Text style={s.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function LoansScreen({ navigation }) {
  const [loans,      setLoans]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  // Repayment Modal state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRepayment, setShowRepayment] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [loanRes, sumRes] = await Promise.all([
        loanService.getLoans(),
        loanService.getSummary(),
      ]);
      setLoans(loanRes.data?.loans || []);
      setSummary(sumRes.data       || null);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const hasFetched = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      fetchAll();
      return () => {
        hasFetched.current = false;
      };
    }, [fetchAll])
  );

  const handleRepaymentSubmit = async (loan, amount) => {
    try {
      await loanService.addPayment(loan._id, { amount });
      fetchAll();
      Alert.alert('✅', 'Payment recorded successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record payment');
      throw err;
    }
  };

  const renderItem = ({ item }) => {
    const totalPayable = item.principal +
      (item.principal * (item.interestRate / 100) * (item.tenureMonths / 12));
    const pct = Math.min(
      Math.round(((item.totalPaid || 0) / totalPayable) * 100), 100
    );
    const remaining = Math.max(0, totalPayable - (item.totalPaid || 0));

    return (
      <View style={s.loanCard}>
        <View style={s.loanTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.loanTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.loanSub}>
              {item.type === 'taken' ? `From: ${item.loanFrom || '—'}` : `To: ${item.loanTo || '—'}`}
            </Text>
          </View>
          <View style={[s.typeBadge, { backgroundColor: item.type === 'taken' ? '#fef2f2' : '#f0fdf4' }]}>
            <Text style={[s.typeBadgeText, { color: item.type === 'taken' ? COLORS.red : COLORS.green }]}>
              {item.type === 'taken' ? '⬇️ Taken' : '⬆️ Given'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Repayment Progress</Text>
            <Text style={s.progressPct}>{pct}%</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, {
              width: `${pct}%`,
              backgroundColor: pct >= 100 ? COLORS.green : COLORS.teal,
            }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Principal',  value: formatCurrency(item.principal),    color: COLORS.teal  },
            { label: 'Paid',       value: formatCurrency(item.totalPaid || 0), color: COLORS.green },
            { label: 'Remaining',  value: formatCurrency(remaining),          color: remaining > 0 ? COLORS.red : COLORS.green },
          ].map((st) => (
            <View key={st.label} style={s.stat}>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLab}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* EMI info + Pay button */}
        <View style={s.emiRow}>
          <View>
            <Text style={s.emiLabel2}>Monthly EMI</Text>
            <Text style={s.emiVal}>{formatCurrency(item.emiAmount || 0)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.emiLabel2}>Rate</Text>
            <Text style={s.emiVal}>{item.interestRate || 0}% p.a.</Text>
          </View>
          {item.status === 'active' && (
            <TouchableOpacity style={s.payBtn} onPress={() => { setSelectedLoan(item); setShowRepayment(true); }}>
              <Text style={s.payBtnText}>💳 Pay EMI</Text>
            </TouchableOpacity>
          )}
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
      {/* Header with Back Button */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.title}>Loans</Text>
          <Text style={s.sub}>{loans.length} loans tracked</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={s.summaryRow}>
          {[
            { label: 'Total Borrowed', value: formatCurrency(summary.totalTaken || 0), red: true },
            { label: 'Still Owe',      value: formatCurrency(summary.totalRemainingTaken || 0), red: true },
            { label: 'Monthly EMI',    value: formatCurrency(summary.monthlyEMI || 0), red: false },
          ].map((sm) => (
            <View key={sm.label} style={[s.summaryCard, sm.red && (sm.value !== '₹0') && { backgroundColor: '#fef2f2' }]}>
              <Text style={[s.summaryVal, sm.red && (sm.value !== '₹0') && { color: COLORS.red }]}>
                {sm.value}
              </Text>
              <Text style={s.summaryLab}>{sm.label}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={loans}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor={COLORS.teal} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🤝</Text>
            <Text style={s.emptyText}>No loans recorded</Text>
          </View>
        }
      />

      <AddLoanModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); fetchAll(); }}
      />

      <RepaymentModal
        visible={showRepayment}
        loan={selectedLoan}
        onClose={() => { setSelectedLoan(null); setShowRepayment(false); }}
        onPay={handleRepaymentSubmit}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: COLORS.onSurface, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center' },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  typeBtnLabel: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  typeBtnDesc: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 2 },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background },
  emiPreview: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 8, padding: 14, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  emiLabel: { fontSize: 11, color: COLORS.onSurfaceVariant },
  emiValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    borderRadius: 8,
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, pb: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.25)' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  sub:   { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8, marginTop: 16 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  summaryVal: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  summaryLab: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  list: { padding: 12, gap: 12, paddingBottom: 100 },
  loanCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  loanTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  loanSub: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  progressWrap: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: COLORS.onSurfaceVariant },
  progressPct: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  progressBar: { height: 8, backgroundColor: '#eff4ff', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal: { fontSize: 11, fontWeight: '700' },
  statLab: { fontSize: 9, color: COLORS.onSurfaceVariant, marginTop: 2 },
  emiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(194, 198, 214, 0.1)' },
  emiLabel2: { fontSize: 10, color: COLORS.onSurfaceVariant },
  emiVal: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface, marginTop: 2 },
  payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  payBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },

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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modalCloseBtnHeader: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16,
    fontWeight: '500',
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    backgroundColor: COLORS.background,
    marginBottom: 16,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSubmitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  modalCancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
});