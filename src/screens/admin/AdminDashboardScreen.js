import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView 
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps'; 
import { useFocusEffect } from '@react-navigation/native';
import { getAllReports } from '../../services/reportService';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [viewMode, setViewMode] = useState('list'); 

  // Stats state
  const [stats, setStats] = useState({ 
    pending: 0, accepted: 0, inProgress: 0, resolved: 0, rejected: 0 
  });

  // 📍 UPDATED DEFAULT REGION: Marilao, Bulacan
  const [region, setRegion] = useState({
    latitude: 14.7566, 
    longitude: 120.9466,
    latitudeDelta: 0.05, // Zoomed in slightly for better city view
    longitudeDelta: 0.05,
  });

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
    setStats({
      pending: data.filter(r => r.status === 'Pending').length,
      accepted: data.filter(r => r.status === 'Accepted').length,
      inProgress: data.filter(r => r.status === 'In Progress').length,
      resolved: data.filter(r => r.status === 'Resolved').length,
      rejected: data.filter(r => r.status === 'Rejected').length,
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60';    // Green
      case 'In Progress': return '#f39c12'; // Orange
      case 'Accepted': return '#3498db';    // Blue
      case 'Rejected': return '#e74c3c';    // Red
      default: return '#95a5a6';            // Grey (Pending)
    }
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

  const renderListItem = ({ item }) => (
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

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
          {renderStatBox('Pending', stats.pending, '#fadbd8', 'Pending')}
          {renderStatBox('Accepted', stats.accepted, '#ebf5fb', 'Accepted')}
          {renderStatBox('Active', stats.inProgress, '#fdebd0', 'In Progress')}
          {renderStatBox('Done', stats.resolved, '#d5f5e3', 'Resolved')}
          {renderStatBox('Rejected', stats.rejected, '#eaecee', 'Rejected')}
        </ScrollView>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? '#fff' : '#555'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? '#fff' : '#555'} />
          </TouchableOpacity>
        </View>

        {filterStatus !== 'All' && (
          <TouchableOpacity onPress={() => handleFilterPress('All')} style={styles.resetFilter}>
            <Text style={styles.resetText}>Show All ({reports.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : viewMode === 'list' ? (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No reports found.</Text>}
        />
      ) : (
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={region} // Uses the new Marilao region
            showsUserLocation={true}
          >
            {filteredReports.map((report) => (
              report.latitude && report.longitude ? (
                <Marker
                  key={report.id}
                  coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                  pinColor={getStatusColor(report.status)}
                >
                  <Callout onPress={() => navigation.navigate('AdminReportDetails', { report })}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{report.title}</Text>
                      <Text style={[styles.calloutStatus, { color: getStatusColor(report.status) }]}>
                        {report.status}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ) : null
            ))}
          </MapView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
  
  statsWrapper: { height: 90 },
  statsContainer: { paddingHorizontal: 15, alignItems: 'center', gap: 10 },
  statBox: { width: 100, height: 70, justifyContent: 'center', alignItems: 'center', borderRadius: 10, elevation: 2, marginRight: 5 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#555', textAlign: 'center' },
  
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10, marginTop: 5 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6, width: 40, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#3498db' },
  resetFilter: { paddingVertical: 5 },
  resetText: { color: '#3498db', fontWeight: '600' },
  
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardDate: { fontSize: 12, color: '#999', marginBottom: 5 },
  cardLocation: { fontSize: 13, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

  mapContainer: { flex: 1, borderRadius: 15, overflow: 'hidden', marginHorizontal: 15, marginBottom: 15 },
  map: { width: '100%', height: '100%' },
  callout: { width: 150, padding: 5, alignItems: 'center' },
  calloutTitle: { fontWeight: 'bold', marginBottom: 2 },
  calloutStatus: { fontSize: 12, fontWeight: 'bold' }
});