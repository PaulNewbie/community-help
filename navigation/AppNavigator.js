import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { onAuthChange, getUserData } from '../services/authService';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        // User is logged in, fetch their role from Firestore
        const result = await getUserData(authUser.uid);
        if (result.success) {
          setUser({ ...authUser, ...result.data });
        }
      } else {
        // User is logged out
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // User is logged in - we'll add HomeScreen later
        <Stack.Navigator>
          <Stack.Screen 
            name="Home" 
            component={PlaceholderHomeScreen}
            options={{ title: 'Community Help' }}
          />
        </Stack.Navigator>
      ) : (
        // User is NOT logged in - show auth screens
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

// Temporary placeholder - we'll replace this with real HomeScreen next
function PlaceholderHomeScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { logoutUser } = require('../services/authService');
    const result = await logoutUser();
    setLoading(false);
    
    if (!result.success) {
      Alert.alert('Logout Failed', result.error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome! You're logged in!</Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#e74c3c',
          padding: 15,
          borderRadius: 10,
          width: 200,
          alignItems: 'center'
        }}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}