import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Neighbor!</Text>
      <Text style={styles.subtitle}>What would you like to do today?</Text>
      
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📢 Report an Issue</Text>
          <Text style={styles.cardDesc}>Garbage, streetlights, etc.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>🗺️ Community Map</Text>
          <Text style={styles.cardDesc}>View active reports nearby</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  cardContainer: { gap: 15 },
  card: { padding: 20, backgroundColor: '#f8f9fa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { color: '#666' }
});