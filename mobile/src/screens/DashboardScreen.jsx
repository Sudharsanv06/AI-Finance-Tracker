import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, Image,
  Modal, FlatList, TextInput, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import { getExpenses } from '../services/expenseService';
import { getSummary as getIncomeSummary } from '../services/incomeService';
import { getSummary as getLoanSummary } from '../services/loanService';
import budgetService from '../services/budgetService';
import billService from '../services/billService';
import api from '../services/api';
import { formatCurrency, COLORS } from '../utils/helpers';
import ChatBot from '../components/ChatBot';
import Ionicons from '@expo/vector-icons/Ionicons';

const BILL_ICONS = {
  Rent: '🏠',
  Electricity: '💡',
  Water: '💧',
  Internet: '📶',
  Phone: '📱',
  Insurance: '🛡️',
  Subscription: '📺',
  EMI: '💳',
  Gas: '🔥',
  'Credit Card': '💰',
  Other: '📄',
};

export default function DashboardScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const isFocused = useIsFocused();

  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [loanSummary, setLoanSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBalancesConfigured, setIsBalancesConfigured] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('Main Account');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [startingBalances, setStartingBalances] = useState({
    'Main Account': 0,
    'Savings Account': 0,
    'Credit Card': 0,
    'Cash': 0,
  });
  const [showEditBalancesModal, setShowEditBalancesModal] = useState(false);
  const [tempBalances, setTempBalances] = useState({
    'Main Account': 0,
    'Savings Account': 0,
    'Credit Card': 0,
    'Cash': 0,
  });

  const loadBalances = useCallback(async () => {
    try {
      if (!user?._id) return;
      const stored = await AsyncStorage.getItem(`starting_balances_${user._id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStartingBalances(parsed);
        setTempBalances(parsed);
        setIsBalancesConfigured(true);
      } else {
        const defaults = {
          'Main Account': 0,
          'Savings Account': 0,
          'Credit Card': 0,
          'Cash': 0,
        };
        setStartingBalances(defaults);
        setTempBalances(defaults);
        setIsBalancesConfigured(false);
      }
    } catch (err) {
      console.log('Error loading starting balances:', err);
    }
  }, [user?._id]);

  const saveBalances = async (newBalances) => {
    try {
      if (!user?._id) return;
      await AsyncStorage.setItem(`starting_balances_${user._id}`, JSON.stringify(newBalances));
      setStartingBalances(newBalances);
      setIsBalancesConfigured(true);
    } catch (err) {
      console.log('Error saving starting balances:', err);
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      const now = new Date();
      const [expRes, allExpRes, incRes, loanRes, budgetRes, billRes, meRes] = await Promise.all([
        getExpenses(),
        api.get('/expenses?limit=10000'),
        getIncomeSummary(),
        getLoanSummary(),
        budgetService.getBudgets(now.getMonth() + 1, now.getFullYear()),
        billService.getBills(),
        api.get('/auth/me').catch(() => null),
      ]);

      setExpenses(expRes.data?.expenses || []);
      setAllExpenses(allExpRes.data?.data?.expenses || []);
      setIncomeSummary(incRes.data || null);
      setLoanSummary(loanRes.data || null);
      setBudgets(budgetRes.data?.budgets || []);
      setBills(billRes.data?.bills || []);
      
      if (meRes?.data?.success && meRes?.data?.data?.user) {
        updateUser(meRes.data.data.user);
      }
    } catch (err) {
      console.log('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  // Clear dashboard states on logout or user ID change to avoid leakage
  useEffect(() => {
    setExpenses([]);
    setAllExpenses([]);
    setIncomeSummary(null);
    setLoanSummary(null);
    setBudgets([]);
    setBills([]);
    setIsBalancesConfigured(false);
    
    const defaults = {
      'Main Account': 0,
      'Savings Account': 0,
      'Credit Card': 0,
      'Cash': 0,
    };
    setStartingBalances(defaults);
    setTempBalances(defaults);
  }, [user?._id]);

  // Load balances and fetch dashboard data when screen is focused
  useEffect(() => {
    if (isFocused && user?._id) {
      loadBalances();
      fetchAll();
    }
  }, [isFocused, user?._id, loadBalances, fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBalances();
    fetchAll();
  };

  // 80% Budget Alert Trigger
  useEffect(() => {
    if (!loading && totalBudgetLimit > 0 && budgetPercent >= 80) {
      Alert.alert(
        '⚠️ Budget Warning',
        `You have utilized ${budgetPercent}% of your monthly budget limit! Please review your expenses.`,
        [{ text: 'Dismiss' }]
      );
    }
  }, [budgets, loading]);

  // Calculations
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYearNum = now.getFullYear();

  const thisMonthIncome = incomeSummary?.monthlyTotal || 0;
  const thisMonthExpenses = allExpenses
    .filter((e) => {
      if (e.approvalStatus === 'Rejected') return false;
      const d = new Date(e.date);
      return d.getMonth() === currentMonthNum && d.getFullYear() === currentYearNum;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyBalance = thisMonthIncome - thisMonthExpenses;

  // Dynamic account balance calculations using all historical expenses
  const allCashExpenses = allExpenses
    .filter(e => e.paymentMethod === 'Cash' && e.approvalStatus !== 'Rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  const allCreditCardExpenses = allExpenses
    .filter(e => e.paymentMethod === 'Credit Card' && e.approvalStatus !== 'Rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  const allBankExpenses = allExpenses
    .filter(e => (e.paymentMethod === 'Bank Transfer' || e.paymentMethod === 'UPI' || e.paymentMethod === 'Cheque') && e.approvalStatus !== 'Rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  // Transfers/Withdrawals from Main Bank Account:
  // - Cash Withdrawal: Deducts from Main (Bank), adds to Cash
  const totalCashWithdrawals = allExpenses
    .filter(e => e.category === 'Cash Withdrawal' && e.approvalStatus !== 'Rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  // - Self Transfer: Deducts from Main (Bank), adds to Savings
  const totalSelfTransfers = allExpenses
    .filter(e => e.category === 'Self Transfer' && e.approvalStatus !== 'Rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  const getAccountBalance = () => {
    const mainStart = startingBalances['Main Account'] ?? 0;
    const savingsStart = startingBalances['Savings Account'] ?? 0;
    const creditStart = startingBalances['Credit Card'] ?? 0;
    const cashStart = startingBalances['Cash'] ?? 0;

    const totalHistoricalIncome = incomeSummary?.allTimeTotal || 0;

    switch(selectedAccount) {
      case 'Savings Account':
        return savingsStart + totalSelfTransfers;
      case 'Credit Card':
        // Limit minus CC expenses
        return creditStart - allCreditCardExpenses;
      case 'Cash':
        return cashStart + totalCashWithdrawals - allCashExpenses;
      case 'Main Account':
      default:
        return mainStart + totalHistoricalIncome - allBankExpenses - totalCashWithdrawals - totalSelfTransfers;
    }
  };

  // Budget calculations
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const budgetPercent = totalBudgetLimit > 0 
    ? Math.min(Math.round((totalBudgetSpent / totalBudgetLimit) * 100), 100) 
    : 0;

  // Upcoming bills (filter unpaid due this month)
  const upcomingBills = bills
    .filter(b => b.isDueThisMonth && !b.isPaid)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 3);

  // Format today's date
  const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0058be" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0058be" />
        }
      >
        {/* Header Section (Hi, Garcia!) */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity style={s.avatarContainer} onPress={() => navigation.navigate('More')}>
              <Text style={s.avatarEmoji}>👤</Text>
            </TouchableOpacity>
            <View>
              <Text style={s.greeting}>Hi, {user?.name?.split(' ')[0]}!</Text>
              <Text style={s.dateText}>{getFormattedDate()}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotificationModal(true)}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.onSurface} />
              <View style={s.badgeDot} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card: Main Account Balance Card */}
        <View style={s.balanceCard}>
          <View style={s.balanceCardTop}>
            <TouchableOpacity style={s.balanceTag} onPress={() => setShowAccountModal(true)}>
              <Text style={s.balanceTagText}>{selectedAccount}</Text>
              <Ionicons name="chevron-down" size={12} color="#ffffff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowActionsModal(true)}>
              <Ionicons name="ellipsis-vertical" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <Text style={s.balanceLabel}>Total Balance</Text>
          <View style={s.amountRow}>
            {isBalancesConfigured ? (
              <>
                <Text style={s.balanceAmount}>
                  {showBalance ? formatCurrency(getAccountBalance()) : '••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={s.eyeIcon}>
                  <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={20} color="#ffffff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setTempBalances({ ...startingBalances });
                  setShowEditBalancesModal(true);
                }}
                style={s.setupBalanceBtn}
                activeOpacity={0.8}
              >
                <Text style={s.setupBalanceBtnText}>⚙️ Set Starting Balance</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.balanceCardDivider} />

          <View style={s.balanceCardBottom}>
            <View style={s.balanceCol}>
              <Text style={s.balanceColLabel}>MONTHLY INCOME</Text>
              <View style={s.trendRow}>
                <Text style={s.balanceColVal}>₹{thisMonthIncome.toLocaleString('en-IN')}</Text>
                <View style={[s.trendBadge, s.trendGreen]}>
                  <Text style={s.trendText}>↗ 5.2%</Text>
                </View>
              </View>
            </View>
            <View style={s.balanceCol}>
              <Text style={s.balanceColLabel}>MONTHLY EXPENSE</Text>
              <View style={s.trendRow}>
                <Text style={s.balanceColVal}>₹{thisMonthExpenses.toLocaleString('en-IN')}</Text>
                <View style={[s.trendBadge, s.trendRed]}>
                  <Text style={s.trendText}>↘ 2.8%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Budget Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Monthly Budget</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BudgetPlanner')}>
              <Text style={s.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {totalBudgetLimit > 0 ? (
            <View>
              <View style={s.progressBarTrack}>
                <View style={[s.progressBarFill, { width: `${budgetPercent}%` }]} />
              </View>
              <View style={s.budgetStatsRow}>
                <Text style={s.budgetStatsText}>
                  Spent {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalBudgetLimit)}
                </Text>
                <Text style={s.budgetPercentText}>{budgetPercent}%</Text>
              </View>
            </View>
          ) : (
            <View style={{ py: 10, alignItems: 'center' }}>
              <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13 }}>No budget limits configured.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BudgetPlanner')} style={s.setupLink}>
                <Text style={s.setupLinkText}>Set Up Budget</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upcoming Bills Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Upcoming Bills</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BillReminders')}>
              <Text style={s.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingBills.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No unpaid bills due soon</Text>
            </View>
          ) : (
            upcomingBills.map((bill) => (
              <View key={bill._id} style={s.billRow}>
                <View style={s.billIconWrapper}>
                  <Text style={s.billIconText}>{BILL_ICONS[bill.category] || '📄'}</Text>
                </View>
                <View style={s.billInfo}>
                  <Text style={s.billName}>{bill.title}</Text>
                  <Text style={s.billDue}>
                    Due {bill.dueDate} • {bill.daysUntilDue} days left
                  </Text>
                </View>
                <Text style={s.billAmount}>{formatCurrency(bill.amount)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Expenses List */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transaction')}>
              <Text style={s.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {expenses.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No expenses recorded yet</Text>
            </View>
          ) : (
            expenses.slice(0, 4).map((exp) => (
              <View key={exp._id} style={s.expenseItem}>
                <View style={[s.billIconWrapper, { backgroundColor: 'rgba(0, 88, 190, 0.05)' }]}>
                  <Text style={s.billIconText}>💸</Text>
                </View>
                <View style={s.billInfo}>
                  <Text style={s.billName} numberOfLines={1}>{exp.description}</Text>
                  <Text style={s.billDue}>{exp.eventId?.name || 'General Expense'}</Text>
                </View>
                <Text style={s.expenseAmount}>-{formatCurrency(exp.amount)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Account Selector Modal */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            {[
              { name: 'Main Account', icon: '🏦', desc: 'Primary Bank Account' },
              { name: 'Savings Account', icon: '📈', desc: 'Investment & Savings' },
              { name: 'Credit Card', icon: '💳', desc: 'Credit Line Limit' },
              { name: 'Cash', icon: '💵', desc: 'Physical Wallet Cash' }
            ].map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[s.modalItem, selectedAccount === item.name && { backgroundColor: COLORS.surfaceContainerLow }]}
                onPress={() => {
                  setSelectedAccount(item.name);
                  setShowAccountModal(false);
                }}
              >
                <Text style={{ fontSize: 22, marginRight: 16 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modalItemText, selectedAccount === item.name && { fontWeight: '700', color: COLORS.primary }]}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant }}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowAccountModal(false)}>
              <Text style={s.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Actions Modal */}
      <Modal visible={showActionsModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Quick Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={s.modalItem}
              onPress={() => {
                setShowActionsModal(false);
                navigation.navigate('AddTransaction');
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>➕</Text>
              <Text style={s.modalItemText}>Add New Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalItem}
              onPress={() => {
                setShowActionsModal(false);
                navigation.navigate('BudgetPlanner');
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>📊</Text>
              <Text style={s.modalItemText}>Set Budget Limit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalItem}
              onPress={() => {
                setShowActionsModal(false);
                navigation.navigate('BillReminders');
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>⏰</Text>
              <Text style={s.modalItemText}>Add Bill Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalItem}
              onPress={() => {
                setShowActionsModal(false);
                setTempBalances({ ...startingBalances });
                setShowEditBalancesModal(true);
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 16 }}>⚙️</Text>
              <Text style={s.modalItemText}>Edit Starting Balances</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowActionsModal(false)}>
              <Text style={s.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Starting Balances Modal */}
      <Modal visible={showEditBalancesModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Starting Balances</Text>
              <TouchableOpacity onPress={() => setShowEditBalancesModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20, marginTop: 10, maxHeight: 300 }}>
              {Object.keys(tempBalances).map((acc) => (
                <View key={acc} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, marginBottom: 4 }}>
                    {acc.toUpperCase()} (₹)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.outlineVariant,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: COLORS.onSurface,
                      fontWeight: '600',
                    }}
                    keyboardType="numeric"
                    value={String(tempBalances[acc])}
                    onChangeText={(val) => {
                      setTempBalances(prev => ({
                        ...prev,
                        [acc]: parseFloat(val) || 0
                      }));
                    }}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: '#0058be',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                marginHorizontal: 20,
                marginTop: 10
              }}
              onPress={() => {
                saveBalances(tempBalances);
                setShowEditBalancesModal(false);
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Save Balances</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowEditBalancesModal(false)}>
              <Text style={s.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Notifications Modal */}
      <Modal visible={showNotificationModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Notification Center</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20, marginTop: 10 }}>
              {/* Dynamic Budget Alert */}
              {totalBudgetLimit > 0 && budgetPercent >= 80 && (
                <View style={[s.notifCard, { borderColor: COLORS.red }]}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.red, fontSize: 13 }}>Budget Alert</Text>
                    <Text style={s.notifText}>You have utilized {budgetPercent}% of your monthly budget limit!</Text>
                  </View>
                </View>
              )}
              {/* Dynamic Bills Alert */}
              {bills.filter(b => b.isDueThisMonth && !b.isPaid && b.daysUntilDue <= 3).map((bill) => (
                <View key={bill._id} style={[s.notifCard, { borderColor: COLORS.red }]}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>⏰</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.red, fontSize: 13 }}>Bill Due Soon</Text>
                    <Text style={s.notifText}>'{bill.title}' of {formatCurrency(bill.amount)} is due in {bill.daysUntilDue} days!</Text>
                  </View>
                </View>
              ))}
              {/* General welcome notification cards */}
              <View style={s.notifCard}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: COLORS.onSurface, fontSize: 13 }}>Welcome!</Text>
                  <Text style={s.notifText}>Welcome to AI Finance Tracker v1.00. Your accounts are ready.</Text>
                </View>
              </View>
              <View style={s.notifCard}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: COLORS.onSurface, fontSize: 13 }}>AI Tip</Text>
                  <Text style={s.notifText}>Click the '+' icon to log transactions, and use the AI Chat bot to analyze your habits.</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowNotificationModal(false)}>
              <Text style={s.modalCloseText}>Dismiss All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ChatBot />
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 48 : 32, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: { fontSize: 22 },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
    position: 'relative',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.red,
    position: 'absolute',
    top: 9,
    right: 10,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#0c2240', // dark premium navy blue background
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0c2240',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  balanceTagText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
  },
  eyeIcon: {
    marginLeft: 12,
    padding: 4,
  },
  balanceCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  balanceCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceCol: { flex: 1 },
  balanceColLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceColVal: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  trendText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },

  // General Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(194, 198, 214, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  viewAllLink: {
    fontSize: 12,
    color: '#0058be',
    fontWeight: '700',
  },

  // Progress Bar
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1', // Indigo budget bar color
    borderRadius: 4,
  },
  budgetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  budgetPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },

  // setup budget button
  setupLink: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  setupLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0058be',
  },

  // Bill Row
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194, 198, 214, 0.15)',
  },
  billIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billIconText: { fontSize: 18 },
  billInfo: {
    flex: 1,
    marginRight: 10,
  },
  billName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  billDue: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '500',
  },
  billAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Expense Item
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(194, 198, 214, 0.15)',
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.red,
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,48,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    paddingTop: 10,
    maxHeight: '80%',
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
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  modalCloseBtn: {
    margin: 16,
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
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  notifText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  setupBalanceBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  setupBalanceBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});