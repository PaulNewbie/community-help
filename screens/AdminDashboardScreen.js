import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#fff3e0' }]}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>View All Reports</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { width: '48%', padding: 20, borderRadius: 10, alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  button: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});