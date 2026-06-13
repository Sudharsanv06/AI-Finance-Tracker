import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { View, StyleSheet }           from 'react-native';
import { useAuth }                    from '../context/AuthContext';
import Ionicons                       from '@expo/vector-icons/Ionicons';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import EventsScreen         from '../screens/EventsScreen';
import ExpensesScreen       from '../screens/ExpensesScreen';
import GoalsScreen          from '../screens/GoalsScreen';
import LoansScreen          from '../screens/LoansScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetPlannerScreen  from '../screens/BudgetPlannerScreen';
import BillRemindersScreen  from '../screens/BillRemindersScreen';
import InvestmentsScreen    from '../screens/InvestmentsScreen';
import SettingsScreen       from '../screens/SettingsScreen';

import { COLORS } from '../utils/helpers';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:        { active: 'home',           inactive: 'home-outline' },
  Transaction: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
  Analytics:   { active: 'stats-chart',    inactive: 'stats-chart-outline' },
  More:        { active: 'person',         inactive: 'person-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Add') return null; // handled via custom icon option
          const icons = TAB_ICONS[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor:  COLORS.outlineVariant,
          borderTopWidth:  StyleSheet.hairlineWidth,
          paddingBottom:   6,
          paddingTop:      6,
          height:          62,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home"        component={DashboardScreen} />
      <Tab.Screen name="Transaction" component={ExpensesScreen}  />
      <Tab.Screen
        name="Add"
        component={View}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddTransaction');
          },
        })}
        options={{
          tabBarIcon: () => (
            <View style={s.floatingButton}>
              <Ionicons name="add" size={32} color="#ffffff" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen name="Analytics"   component={EventsScreen}    />
      <Tab.Screen name="More"        component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main"          component={MainTabs}   />
          <Stack.Screen name="Goals"         component={GoalsScreen} />
          <Stack.Screen name="Loans"         component={LoansScreen} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
          <Stack.Screen name="BillReminders" component={BillRemindersScreen} />
          <Stack.Screen name="Investments"   component={InvestmentsScreen} />
          <Stack.Screen name="Settings"      component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"    component={LoginScreen}    />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const s = StyleSheet.create({
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0058be', // EventFi core primary Vibrant Blue
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -14,
    shadowColor: '#0058be',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});