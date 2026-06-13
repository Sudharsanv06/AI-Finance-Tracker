import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  ScrollView, Platform
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as goalService from '../services/goalService';
import { formatCurrency, COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

function AddGoalModal({ visible, onClose, onSaved }) {
  const [title,        setTitle]        = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount,setCurrentAmount]= useState('0');
  const [icon,         setIcon]         = useState('🎯');
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Goal title is required');
    if (!targetAmount || isNaN(targetAmount)) return Alert.alert('Error', 'Valid target amount required');

    setLoading(true);
    try {
      await goalService.createGoal({
        title: title.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        icon,
      });
      setTitle(''); setTargetAmount(''); setCurrentAmount('0'); setIcon('🎯');
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const emojis = ['🎯', '🏠', '🚗', '✈️', '🎓', '💻', '💍', '💰', '🛡️'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>New Savings Goal</Text>
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <Text style={ms.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={ms.label}>GOAL TITLE</Text>
          <TextInput style={ms.input} value={title} onChangeText={setTitle}
            placeholder="e.g. Emergency Fund" placeholderTextColor={COLORS.outline} />

          <Text style={ms.label}>TARGET AMOUNT (₹)</Text>
          <TextInput style={ms.input} value={targetAmount} onChangeText={setTargetAmount}
            placeholder="500000" placeholderTextColor={COLORS.outline} keyboardType="numeric" />

          <Text style={ms.label}>INITIAL SAVINGS (₹)</Text>
          <TextInput style={ms.input} value={currentAmount} onChangeText={setCurrentAmount}
            placeholder="10000" placeholderTextColor={COLORS.outline} keyboardType="numeric" />

          <Text style={ms.label}>ICON</Text>
          <View style={ms.emojiGrid}>
            {emojis.map((e) => (
              <TouchableOpacity key={e} onPress={() => setIcon(e)}
                style={[ms.emojiBtn, icon === e && ms.emojiBtnActive]}>
                <Text style={ms.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[ms.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={ms.submitText}>+ Create Goal</Text>
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

function ContributeModal({ visible, onClose, onContribute, goal }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return Alert.alert('Error', 'Please enter a valid positive amount.');
    }
    setLoading(true);
    try {
      await onContribute(goal, parsedAmount);
      setAmount('');
      onClose();
    } catch (err) {
      // Alert is already handled inside the caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Contribute to Goal</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtnHeader}>
              <Ionicons name="close" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <Text style={s.modalSub}>Contribution for "{goal?.title}"</Text>
            
            <Text style={s.modalLabel}>AMOUNT (₹)</Text>
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
                <Text style={s.modalSubmitBtnText}>Add Contribution</Text>
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

export default function GoalsScreen({ navigation }) {
  const [goals,      setGoals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  // Contribute states
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showContribute, setShowContribute] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalService.getGoals();
      setGoals(res.data?.goals || res.goals || []);
    } catch (err) {
      console.log('Goals fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const hasFetched = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      fetchGoals();
      return () => {
        hasFetched.current = false;
      };
    }, [fetchGoals])
  );

  const handleContributeSubmit = async (goal, amount) => {
    try {
      await goalService.addContribution(goal._id, amount);
      fetchGoals();
      Alert.alert('Success', `Contributed ${formatCurrency(amount)} successfully!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to contribute');
      throw err;
    }
  };

  const handleDelete = (goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalService.deleteGoal(goal._id);
              fetchGoals();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const totalSaved = goals.reduce((acc, curr) => acc + (curr.currentAmount || 0), 0);

  const renderItem = ({ item }) => {
    const pct = Math.min(
      Math.round(((item.currentAmount || 0) / item.targetAmount) * 100), 100
    );

    return (
      <View style={s.goalCard}>
        <View style={s.cardTop}>
          <View style={s.goalAvatar}>
            <Text style={s.goalEmoji}>{item.icon || '🎯'}</Text>
          </View>
          <View style={s.goalInfo}>
            <Text style={s.goalTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.goalTarget}>Target: {formatCurrency(item.targetAmount)}</Text>
          </View>
          <View style={s.goalStatus}>
            <Text style={s.goalPct}>{pct}%</Text>
            <Text style={s.goalStatusLabel}>SAVED</Text>
          </View>
        </View>

        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>

        <View style={s.cardBottom}>
          <Text style={s.currentAmount}>Saved: {formatCurrency(item.currentAmount)}</Text>
          <View style={s.cardActions}>
            <TouchableOpacity style={s.contributeBtn} onPress={() => { setSelectedGoal(item); setShowContribute(true); }}>
              <Text style={s.contributeBtnText}>+ Contribute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={s.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <Text style={s.title}>Savings Goals</Text>
          <Text style={s.sub}>Track your financial milestones</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={s.summaryCard}>
        <View style={s.summaryContent}>
          <Text style={s.summaryLabel}>TOTAL SAVED</Text>
          <Text style={s.summaryAmount}>{formatCurrency(totalSaved)}</Text>
          <View style={s.summaryTrending}>
            <Text style={s.trendingText}>Keep investing in your future 🚀</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchGoals}
            tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🎯</Text>
            <Text style={s.emptyText}>No savings goals yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.emptyBtnText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AddGoalModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); fetchGoals(); }}
      />

      <ContributeModal
        visible={showContribute}
        goal={selectedGoal}
        onClose={() => { setSelectedGoal(null); setShowContribute(false); }}
        onContribute={handleContributeSubmit}
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
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  emojiText: { fontSize: 20 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 56, pb: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(194, 198, 214, 0.25)' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  sub:   { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#0058be', // EventFi Core primary gradient
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 16,
  },
  summaryContent: { zIndex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 30, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  summaryTrending: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  trendingText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // List & Cards
  list: { padding: 12, gap: 12, paddingBottom: 100 },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 88, 190, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalEmoji: { fontSize: 20 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  goalTarget: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  goalStatus: { alignItems: 'flex-end' },
  goalPct: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  goalStatusLabel: { fontSize: 8, fontWeight: '700', color: COLORS.onSurfaceVariant, marginTop: 2 },

  progressBar: {
    height: 8,
    backgroundColor: '#eff4ff',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0058be',
    borderRadius: 4,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(194, 198, 214, 0.1)',
  },
  currentAmount: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contributeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 108, 73, 0.08)',
  },
  contributeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.red50,
  },
  deleteBtnText: { fontSize: 11 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

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
