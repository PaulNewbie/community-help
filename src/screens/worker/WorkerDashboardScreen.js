import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllReports } from '../../services/reportService';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerDashboardScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const result = await getAllReports();
    if (result.success) {
      // Worker only sees Accepted (Ready to start) or In Progress (Active)
      const workerJobs = result.data.filter(r => 
        r.status === 'Accepted' || r.status === 'In Progress'
      );
      setJobs(workerJobs);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, item.status === 'In Progress' && styles.activeCard]} 
      onPress={() => navigation.navigate('WorkerJob', { report: item })}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'In Progress' ? '#f39c12' : '#27ae60' }]}>
          <Text style={styles.badgeText}>{item.status === 'In Progress' ? 'ACTIVE' : 'OPEN'}</Text>
        </View>
      </View>
      
      <Text style={styles.location}>📍 {item.location}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      
      {item.planNotes ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>👷 Instructions:</Text>
          <Text style={styles.noteText} numberOfLines={1}>{item.planNotes}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {jobs.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No jobs available right now.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 10 },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#ccc' },
  activeCard: { borderLeftColor: '#f39c12', backgroundColor: '#fffcf5' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  location: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '600' },
  desc: { fontSize: 14, color: '#777', marginBottom: 10 },
  
  noteBox: { backgroundColor: '#f0f3f5', padding: 10, borderRadius: 8, marginTop: 5 },
  noteLabel: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  noteText: { fontSize: 13, color: '#555', fontStyle: 'italic' }
});