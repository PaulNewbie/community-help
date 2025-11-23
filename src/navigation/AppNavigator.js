import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Icons for tabs

import { onAuthChange, getUserData } from '../services/authService';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Citizen Screens
import HomeScreen from '../screens/citizen/HomeScreen';
import ProfileScreen from '../screens/shared/ProfileScreen'; // Note: Shared folder
import ReportFormScreen from '../screens/citizen/ReportFormScreen';
import MyReportsScreen from '../screens/citizen/MyReportsScreen';
import MapScreen from '../screens/citizen/MapScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminReportDetailScreen from '../screens/admin/AdminReportDetailScreen';

// Shared Details
import ReportDetailsScreen from '../screens/shared/ReportDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Citizen Tab Navigator
function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'My Reports') iconName = focused ? 'list' : 'list-outline'; // <--- Icon for reports
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Community Help' }} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="My Reports" component={MyReportsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e67e22', // Different color for admins
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Admin Panel' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 3. Main Root Navigator
export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        const result = await getUserData(authUser.uid);
        if (result.success) {
          setUser({ ...authUser, ...result.data });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === 'admin' ? (
            // Admin Stack Group
            <Stack.Group>
              <Stack.Screen name="AdminRoot" component={AdminTabs} />
              {/* Add the Detail Screen here so it sits on top of the tabs */}
              <Stack.Screen 
                name="AdminReportDetails" 
                component={AdminReportDetailScreen} 
                options={{ headerShown: true, title: 'Manage Report' }} 
              />
            </Stack.Group>
          ) : (
            // Citizen Stack Group
            <Stack.Group> 
              <Stack.Screen name="CitizenRoot" component={CitizenTabs} />
              <Stack.Screen 
                name="ReportForm" 
                component={ReportFormScreen} 
                options={{ headerShown: true, title: 'Report Issue' }} 
              />
              <Stack.Screen 
                name="ReportDetails" 
                component={ReportDetailsScreen} 
                options={{ headerShown: true, title: 'Report Status' }} 
              />
            </Stack.Group>
          )
        ) : (
          // Auth Stack
          <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}