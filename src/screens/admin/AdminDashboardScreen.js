import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllReports } from '../../services/reportService';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'In Progress', 'Resolved'

  // Stats state
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0 });

  const fetchReports = async () => {
    setLoading(true);
    const result = await getAllReports();
    if (result.success) {
      setReports(result.data);
      calculateStats(result.data);
      applyFilter(result.data, filterStatus);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const calculateStats = (data) => {
    const pending = data.filter(r => r.status === 'Pending').length;
    const inProgress = data.filter(r => r.status === 'In Progress').length;
    const resolved = data.filter(r => r.status === 'Resolved').length;
    setStats({ pending, inProgress, resolved });
  };

  const applyFilter = (data, status) => {
    if (status === 'All') {
      setFilteredReports(data);
    } else {
      setFilteredReports(data.filter(r => r.status === status));
    }
  };

  const handleFilterPress = (status) => {
    setFilterStatus(status);
    applyFilter(reports, status);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const renderStatBox = (label, count, color, statusKey) => (
    <TouchableOpacity 
      style={[
        styles.statBox, 
        { backgroundColor: color, opacity: filterStatus === statusKey || filterStatus === 'All' ? 1 : 0.5 }
      ]}
      onPress={() => handleFilterPress(statusKey)}
    >
      <Text style={styles.statNumber}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('AdminReportDetails', { report: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>
        {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
      </Text>
      <Text style={styles.cardLocation} numberOfLines={1}>📍 {item.location}</Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60';
      case 'In Progress': return '#f39c12';
      default: return '#e74c3c';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        {renderStatBox('Pending', stats.pending, '#fadbd8', 'Pending')}
        {renderStatBox('In Progress', stats.inProgress, '#fdebd0', 'In Progress')}
        {renderStatBox('Resolved', stats.resolved, '#d5f5e3', 'Resolved')}
      </View>

      {/* Filter Reset Button (only show if filtered) */}
      {filterStatus !== 'All' && (
        <TouchableOpacity onPress={() => handleFilterPress('All')} style={styles.resetFilter}>
          <Text style={styles.resetText}>Show All Reports ({reports.length})</Text>
        </TouchableOpacity>
      )}

      {/* List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No reports found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 15 },
  statBox: { width: '31%', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2, textAlign: 'center' },
  resetFilter: { alignItems: 'center', marginBottom: 10 },
  resetText: { color: '#3498db', fontWeight: '600' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardDate: { fontSize: 12, color: '#999', marginBottom: 5 },
  cardLocation: { fontSize: 13, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});