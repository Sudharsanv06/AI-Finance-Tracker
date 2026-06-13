import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider }    from 'react-native-safe-area-context';
import { AuthProvider }        from './src/context/AuthContext';
import AppNavigator            from './src/navigation/AppNavigator';
import { StatusBar }           from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="dark" backgroundColor="#f8f9ff" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}