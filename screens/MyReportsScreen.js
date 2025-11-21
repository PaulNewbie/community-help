import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  ActivityIndicator, RefreshControl, TouchableOpacity 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { getUserReports } from '../services/reportService';

export default function MyReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    if (!auth.currentUser) return;
    
    const result = await getUserReports(auth.currentUser.uid);
    if (result.success) {
      setReports(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Reload data whenever screen comes into focus (e.g., after submitting a new report)
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60'; // Green
      case 'In Progress': return '#f39c12'; // Orange
      default: return '#e74c3c'; // Red (Pending)
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>My Reports</Text>
      
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15, color: '#2c3e50' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2, flexDirection: 'row', height: 120 },
  cardImage: { width: 100, height: '100%' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  cardDate: { fontSize: 12, color: '#95a5a6', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#34495e' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#7f8c8d' }
});