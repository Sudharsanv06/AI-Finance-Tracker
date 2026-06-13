import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as incomeService from '../services/incomeService';
import { formatCurrency, formatDate, COLORS } from '../utils/helpers';

const SOURCES = ['Salary','Freelance','Business','Rental','Investment Returns','Bonus','Gift','Other'];
const SOURCE_ICONS = { Salary:'💼', Freelance:'💻', Business:'🏢', Rental:'🏠', 'Investment Returns':'📈', Bonus:'🎁', Gift:'🎀', Other:'💰' };

function AddIncomeModal({ visible, onClose, onSaved }) {
  const [source,  setSource]  = useState('Salary');
  const [amount,  setAmount]  = useState('');
  const [desc,    setDesc]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) return Alert.alert('Error', 'Valid amount required');
    setLoading(true);
    try {
      await incomeService.createIncome({ source, amount: parseFloat(amount), description: desc });
      setAmount(''); setDesc(''); setSource('Salary');
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>Add Income</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={ms.label}>SOURCE</Text>
        <View style={ms.sourceGrid}>
          {SOURCES.map((src) => (
            <TouchableOpacity key={src} onPress={() => setSource(src)}
              style={[ms.srcBtn, source === src && ms.srcBtnActive]}>
              <Text style={ms.srcIcon}>{SOURCE_ICONS[src]}</Text>
              <Text style={[ms.srcText, source === src && ms.srcTextActive]}>
                {src}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ms.label}>AMOUNT (₹)</Text>
        <TextInput style={ms.input} value={amount} onChangeText={setAmount}
          placeholder="50000" placeholderTextColor={COLORS.teal100} keyboardType="numeric" />

        <Text style={ms.label}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput style={ms.input} value={desc} onChangeText={setDesc}
          placeholder="e.g. June salary" placeholderTextColor={COLORS.teal100} />

        <TouchableOpacity style={[ms.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.cream} />
            : <Text style={ms.submitText}>+ Add Income</Text>
          }
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function IncomeScreen() {
  const [incomes,    setIncomes]    = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [incRes, sumRes] = await Promise.all([
        incomeService.getIncome(),
        incomeService.getSummary(),
      ]);
      setIncomes(incRes.data?.incomes    || []);
      setSummary(sumRes.data             || null);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const renderItem = ({ item }) => (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Text style={s.rowIconText}>{SOURCE_ICONS[item.source] || '💰'}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle}>{item.source}</Text>
        <Text style={s.rowSub}>{item.description || formatDate(item.date)}</Text>
      </View>
      <Text style={s.rowAmount}>{formatCurrency(item.amount)}</Text>
    </View>
  );

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
          <Text style={s.title}>Income</Text>
          <Text style={s.sub}>{incomes.length} entries</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {summary && (
        <View style={s.summaryRow}>
          {[
            { label: 'This Month', value: summary.monthlyTotal || 0 },
            { label: 'This Year',  value: summary.yearlyTotal  || 0 },
            { label: 'All Time',   value: summary.allTimeTotal || 0 },
          ].map((s2) => (
            <View key={s2.label} style={s.summaryCard}>
              <Text style={s.summaryValue}>{formatCurrency(s2.value)}</Text>
              <Text style={s.summaryLabel}>{s2.label}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={incomes}
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
            <Text style={s.emptyIcon}>💰</Text>
            <Text style={s.emptyText}>No income recorded yet</Text>
          </View>
        }
      />

      <AddIncomeModal
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
  title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: COLORS.onSurface, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  srcBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', minWidth: 80 },
  srcBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  srcIcon: { fontSize: 18, marginBottom: 2 },
  srcText: { fontSize: 10, fontWeight: '600', color: COLORS.onSurfaceVariant },
  srcTextActive: { color: COLORS.primary },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface },
  sub:   { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  summaryLabel: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 108, 73, 0.05)', alignItems: 'center', justifyContent: 'center' },
  rowIconText: { fontSize: 20 },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  rowSub:   { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant },
});