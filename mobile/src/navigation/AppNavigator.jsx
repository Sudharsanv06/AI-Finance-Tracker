import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { Text, View }                 from 'react-native';
import { useAuth }                    from '../context/AuthContext';

import LoginScreen     from '../screens/LoginScreen';
import RegisterScreen  from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventsScreen    from '../screens/EventsScreen';
import ExpensesScreen  from '../screens/ExpensesScreen';
import IncomeScreen    from '../screens/IncomeScreen';
import LoansScreen     from '../screens/LoansScreen';
import GoalsScreen     from '../screens/GoalsScreen';
import ProfileScreen   from '../screens/ProfileScreen';

import { COLORS } from '../utils/helpers';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '📊',
  Events:    '📅',
  Expenses:  '💸',
  Income:    '💰',
  More:      '☰',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 20 }}>
            {TAB_ICONS[route.name] || '•'}
          </Text>
        ),
        tabBarActiveTintColor:   COLORS.teal,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor:  COLORS.teal100,
          paddingBottom:   6,
          paddingTop:      5,
          height:          62,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Events"    component={EventsScreen}    />
      <Tab.Screen name="Expenses"  component={ExpensesScreen}  />
      <Tab.Screen name="Income"    component={IncomeScreen}    />
      <Tab.Screen name="More"      component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main"  component={MainTabs}   />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Loans" component={LoansScreen} />
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