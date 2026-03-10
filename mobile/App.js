import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ResetSuccessScreen from './src/screens/ResetSuccessScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import MedicineListScreen from './src/screens/MedicineListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';
import AddScheduleScreen from './src/screens/AddScheduleScreen';
import AlarmScreen from './src/screens/AlarmScreen';

// Theme
import { COLORS, SIZES, FONTS } from './src/theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Tab Icon Component ──────────────────────────────────

const TAB_ICONS = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  ScheduleTab: { active: 'calendar', inactive: 'calendar-outline' },
  MedicineTab: { active: 'medkit', inactive: 'medkit-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

// ─── Stack Navigators for each tab ───────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function ScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScheduleMain" component={ScheduleScreen} />
      <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
    </Stack.Navigator>
  );
}

function MedicineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MedicineList" component={MedicineListScreen} />
      <Stack.Screen name="AddMedicine" component={AddMedicineScreen} />
    </Stack.Navigator>
  );
}

// ─── Main App ────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [session, setSession] = useState(null);
  const [resetFlow, setResetFlow] = useState({ email: '', resetToken: '' });

  const handleLogout = () => {
    setSession(null);
    setScreen('welcome');
  };

  // ─── Auth Flow (state-based) ──────────────────────────

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onJoinNow={() => setScreen('register')}
        onLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onBackToWelcome={() => setScreen('welcome')}
        onSwitchToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={(nextSession) => {
          setSession(nextSession || null);
          setScreen('home');
        }}
        onForgotPassword={() => {
          setResetFlow({ email: '', resetToken: '' });
          setScreen('forgot-password');
        }}
        onBackToRegister={() => setScreen('register')}
      />
    );
  }

  if (screen === 'forgot-password') {
    return (
      <ForgotPasswordScreen
        onBackToLogin={() => setScreen('login')}
        onOtpSent={(email) => {
          setResetFlow({ email, resetToken: '' });
          setScreen('verify-otp');
        }}
      />
    );
  }

  if (screen === 'verify-otp') {
    return (
      <VerifyOtpScreen
        email={resetFlow.email}
        onBack={() => setScreen('forgot-password')}
        onBackToLogin={() => {
          setResetFlow({ email: '', resetToken: '' });
          setScreen('login');
        }}
        onVerified={({ email, resetToken }) => {
          setResetFlow({ email: email || resetFlow.email, resetToken });
          setScreen('reset-password');
        }}
      />
    );
  }

  if (screen === 'reset-password') {
    return (
      <ResetPasswordScreen
        email={resetFlow.email}
        resetToken={resetFlow.resetToken}
        onBack={() => setScreen('verify-otp')}
        onBackToLogin={() => {
          setResetFlow({ email: '', resetToken: '' });
          setScreen('login');
        }}
        onResetSuccess={() => setScreen('reset-success')}
      />
    );
  }

  if (screen === 'reset-success') {
    return (
      <ResetSuccessScreen
        onBackToLogin={() => {
          setResetFlow({ email: '', resetToken: '' });
          setScreen('login');
        }}
      />
    );
  }

  // ─── Main App (after login) ───────────────────────────

  function ProfileStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="ProfileMain"
          component={ProfileScreen}
          initialParams={{ session, onLogout: handleLogout }}
        />
      </Stack.Navigator>
    );
  }

  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={24} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.tabInactive,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ tabBarLabel: 'Trang chủ' }}
        />
        <Tab.Screen
          name="ScheduleTab"
          component={ScheduleStack}
          options={{ tabBarLabel: 'Lịch' }}
        />
        <Tab.Screen
          name="MedicineTab"
          component={MedicineStack}
          options={{ tabBarLabel: 'Kho thuốc' }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{ tabBarLabel: 'Cá nhân' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Alarm"
            component={AlarmScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: SIZES.tabBarHeight,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    ...FONTS.medium,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
