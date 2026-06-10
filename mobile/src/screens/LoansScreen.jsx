import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as loanService from '../services/loanService';
import { formatCurrency, COLORS } from '../utils/helpers';

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>Add Loan</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

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
          placeholder="e.g. Home loan from SBI" placeholderTextColor={COLORS.teal100} />

        <Text style={ms.label}>{type === 'taken' ? 'BORROWED FROM' : 'LENT TO'}</Text>
        <TextInput style={ms.input} value={loanFrom} onChangeText={setLoanFrom}
          placeholder={type === 'taken' ? 'e.g. SBI Bank' : 'e.g. Ravi'} placeholderTextColor={COLORS.teal100} />

        <Text style={ms.label}>PRINCIPAL (₹)</Text>
        <TextInput style={ms.input} value={principal} onChangeText={setPrincipal}
          placeholder="500000" placeholderTextColor={COLORS.teal100} keyboardType="numeric" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={ms.label}>INTEREST RATE (%)</Text>
            <TextInput style={ms.input} value={interestRate} onChangeText={setInterestRate}
              placeholder="8.5" placeholderTextColor={COLORS.teal100} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ms.label}>TENURE (MONTHS)</Text>
            <TextInput style={ms.input} value={tenureMonths} onChangeText={setTenureMonths}
              placeholder="24" placeholderTextColor={COLORS.teal100} keyboardType="numeric" />
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
            ? <ActivityIndicator color={COLORS.cream} />
            : <Text style={ms.submitText}>+ Add Loan</Text>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function LoansScreen() {
  const [loans,      setLoans]      = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePayment = (loan) => {
    Alert.prompt(
      'Record Payment',
      `EMI Amount: ${formatCurrency(loan.emiAmount)}\nEnter payment amount:`,
      async (amountStr) => {
        const amount = parseFloat(amountStr);
        if (!amount || amount <= 0) return;
        try {
          await loanService.addPayment(loan._id, { amount });
          fetchAll();
          Alert.alert('✅', 'Payment recorded successfully');
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed');
        }
      },
      'plain-text',
      String(loan.emiAmount || '')
    );
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
            <TouchableOpacity style={s.payBtn} onPress={() => handlePayment(item)}>
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
      <View style={s.header}>
        <View>
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
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.teal },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.teal50, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: COLORS.teal, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.tealLight, letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.teal100, alignItems: 'center' },
  typeBtnActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal50 },
  typeBtnLabel: { fontSize: 13, fontWeight: '700', color: COLORS.teal },
  typeBtnDesc: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  input: { borderWidth: 1.5, borderColor: COLORS.teal100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.teal },
  emiPreview: { backgroundColor: COLORS.teal50, borderRadius: 12, padding: 14, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.teal100 },
  emiLabel: { fontSize: 11, color: COLORS.gray },
  emiValue: { fontSize: 22, fontWeight: '800', color: COLORS.teal, marginTop: 4 },
  submitBtn: { backgroundColor: COLORS.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.teal },
  sub:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: COLORS.cream, fontSize: 13, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.teal100 },
  summaryVal: { fontSize: 12, fontWeight: '800', color: COLORS.teal },
  summaryLab: { fontSize: 9, color: COLORS.gray, marginTop: 2, textAlign: 'center' },
  list: { padding: 12, gap: 12, paddingBottom: 100 },
  loanCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.teal100, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  loanTitle: { fontSize: 14, fontWeight: '800', color: COLORS.teal },
  loanSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  progressWrap: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: COLORS.gray },
  progressPct: { fontSize: 11, fontWeight: '800', color: COLORS.teal },
  progressBar: { height: 8, backgroundColor: COLORS.creamDark, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: COLORS.teal50, borderRadius: 10, padding: 8, alignItems: 'center' },
  statVal: { fontSize: 11, fontWeight: '800' },
  statLab: { fontSize: 9, color: COLORS.gray, marginTop: 2 },
  emiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.teal50 },
  emiLabel2: { fontSize: 10, color: COLORS.gray },
  emiVal: { fontSize: 13, fontWeight: '800', color: COLORS.teal, marginTop: 2 },
  payBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  payBtnText: { color: COLORS.cream, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.gray },
});