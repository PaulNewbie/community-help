import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { logoutUser } from '../../services/authService';

export default function ProfileScreen() {
  const handleLogout = async () => {
    const result = await logoutUser();
    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  logoutButton: { backgroundColor: '#e74c3c', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});