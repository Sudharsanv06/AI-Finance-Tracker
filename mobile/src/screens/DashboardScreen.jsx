import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth }                           from '../context/AuthContext';
import { getExpenses }                       from '../services/expenseService';
import { getSummary as getIncomeSummary }    from '../services/incomeService';
import { getSummary as getLoanSummary }      from '../services/loanService';
import { getGoals }                          from '../services/goalService';
import { formatCurrency, COLORS, getInitials } from '../utils/helpers';
import api from '../services/api';
import ChatBot from '../components/ChatBot';      // ✅ added chatbot import

export default function DashboardScreen() {
  const { user } = useAuth();

  const [expenses,     setExpenses]     = useState([]);
  const [incomeSummary,setIncomeSummary]= useState(null);
  const [loanSummary,  setLoanSummary]  = useState(null);
  const [goals,        setGoals]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [expRes, incRes, loanRes, goalRes] = await Promise.all([
        getExpenses(),
        getIncomeSummary(),
        getLoanSummary(),
        getGoals(),
      ]);
      setExpenses(expRes.data?.expenses     || []);
      setIncomeSummary(incRes.data          || null);
      setLoanSummary(loanRes.data           || null);
      setGoals(goalRes.data?.goals          || []);
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const pending   = expenses.filter((e) => e.approvalStatus === 'Pending').length;
  const thisMonth = incomeSummary?.monthlyTotal || 0;
  const totalOwed = loanSummary?.totalRemainingTaken || 0;
  const activeGoals = goals.filter((g) => g.status === 'active').length;

  const ROLE_COLORS = {
    Organizer:    { bg: COLORS.teal50,  text: COLORS.teal },
    Approver:     { bg: '#fffbeb',       text: '#d97706'   },
    FinanceAdmin: { bg: '#f0fdf4',       text: '#16a34a'   },
  };
  const rc = ROLE_COLORS[user?.role] || ROLE_COLORS.Organizer;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <>  {/* ✅ fragment to allow ScrollView + ChatBot */}
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.teal} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>
              Good day, {user?.name?.split(' ')[0]} 👋
            </Text>
            <Text style={s.subgreeting}>Financial Overview</Text>
          </View>
          <View style={s.roleRow}>
            <View style={[s.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[s.roleText, { color: rc.text }]}>
                {user?.role === 'FinanceAdmin' ? 'Finance Admin' : user?.role}
              </Text>
            </View>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(user?.name)}</Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.grid}>
          {[
            { label: 'This Month Income', value: formatCurrency(thisMonth), icon: '💰', color: COLORS.teal50 },
            { label: 'Pending Approvals', value: pending,                   icon: '⏳',
              color: pending > 0 ? '#fffbeb' : COLORS.teal50,
              textColor: pending > 0 ? '#d97706' : COLORS.teal },
            { label: 'Loan Outstanding',  value: formatCurrency(totalOwed), icon: '🤝',
              color: totalOwed > 0 ? '#fef2f2' : COLORS.teal50,
              textColor: totalOwed > 0 ? COLORS.red : COLORS.teal },
            { label: 'Active Goals',      value: activeGoals,               icon: '🎯', color: COLORS.teal50 },
          ].map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: stat.color }]}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={[s.statValue, { color: stat.textColor || COLORS.teal }]}>
                {stat.value}
              </Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Expenses */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Expenses</Text>
          {expenses.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No expenses yet</Text>
            </View>
          ) : (
            expenses.slice(0, 5).map((exp) => (
              <View key={exp._id} style={s.expRow}>
                <View style={s.expLeft}>
                  <Text style={s.expDesc} numberOfLines={1}>
                    {exp.description}
                  </Text>
                  <Text style={s.expEvent} numberOfLines={1}>
                    {exp.eventId?.name || '—'}
                  </Text>
                </View>
                <View style={s.expRight}>
                  <Text style={s.expAmount}>{formatCurrency(exp.amount)}</Text>
                  <View style={[
                    s.statusDot,
                    {
                      backgroundColor:
                        exp.approvalStatus === 'Pending'  ? COLORS.amber  :
                        exp.approvalStatus === 'Approved' ? COLORS.green  :
                        exp.approvalStatus === 'Paid'     ? COLORS.teal   :
                        COLORS.red,
                    },
                  ]}>
                    <Text style={s.statusText}>{exp.approvalStatus}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Active Goals */}
        {goals.filter((g) => g.status === 'active').length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Active Goals</Text>
            {goals.filter((g) => g.status === 'active').slice(0, 3).map((goal) => (
              <View key={goal._id} style={s.goalRow}>
                <Text style={s.goalIcon}>{goal.icon || '🎯'}</Text>
                <View style={s.goalInfo}>
                  <Text style={s.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  <View style={s.goalBar}>
                    <View style={[
                      s.goalBarFill,
                      { width: `${goal.progressPercent || 0}%` },
                    ]} />
                  </View>
                </View>
                <Text style={s.goalPct}>{goal.progressPercent || 0}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ChatBot />  {/* ✅ chatbot added after ScrollView */}
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content:   { padding: 16, paddingTop: 56 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:  { fontSize: 22, fontWeight: '800', color: COLORS.teal },
  subgreeting: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  roleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  roleText:  { fontSize: 11, fontWeight: '700' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.cream, fontSize: 13, fontWeight: '800' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  statCard: {
    width: '47.5%', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.teal100,
  },
  statIcon:  { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.teal, marginBottom: 4 },
  statLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  section: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.teal100,
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.teal, marginBottom: 12 },
  emptyBox:  { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.gray, fontSize: 13 },
  expRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.teal50,
  },
  expLeft:   { flex: 1, marginRight: 12 },
  expDesc:   { fontSize: 13, fontWeight: '700', color: COLORS.teal },
  expEvent:  { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  expRight:  { alignItems: 'flex-end' },
  expAmount: { fontSize: 13, fontWeight: '800', color: COLORS.teal },
  statusDot: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusText:{ fontSize: 9, color: COLORS.white, fontWeight: '700' },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.teal50,
  },
  goalIcon:  { fontSize: 22 },
  goalInfo:  { flex: 1 },
  goalTitle: { fontSize: 12, fontWeight: '700', color: COLORS.teal, marginBottom: 6 },
  goalBar: {
    height: 6, backgroundColor: COLORS.creamDark,
    borderRadius: 3, overflow: 'hidden',
  },
  goalBarFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 3 },
  goalPct: { fontSize: 11, fontWeight: '700', color: COLORS.teal, width: 35, textAlign: 'right' },
});