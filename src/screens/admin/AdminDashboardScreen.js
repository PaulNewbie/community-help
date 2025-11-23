import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Dimensions 
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps'; // <--- IMPORT MAP COMPONENTS
import { useFocusEffect } from '@react-navigation/native';
import { getAllReports } from '../../services/reportService';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [viewMode, setViewMode] = useState('list'); // <--- ADD VIEW MODE STATE ('list' or 'map')

  // Stats state
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0 });

  // Default Map Region (Adjust to your preferred default location)
  const [region, setRegion] = useState({
    latitude: 14.5995, 
    longitude: 120.9842,
    latitudeDelta: 0.09,
    longitudeDelta: 0.09,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60'; // Green
      case 'In Progress': return '#f39c12'; // Orange
      default: return '#e74c3c'; // Red
    }
  };

  // --- RENDER HELPERS ---

  const renderStatBox = (label, count, color,qcKey) => (
    <TouchableOpacity 
      style={[
        styles.statBox, 
        { backgroundColor: color, opacity: filterStatus === qcKey || filterStatus === 'All' ? 1 : 0.5 }
      ]}
      onPress={() => handleFilterPress(qcKey)}
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
      <View style={styles.statsContainer}>
        {renderStatBox('Pending', stats.pending, '#fadbd8', 'Pending')}
        {renderStatBox('In Progress', stats.inProgress, '#fdebd0', 'In Progress')}
        {renderStatBox('Resolved', stats.resolved, '#d5f5e3', 'Resolved')}
      </View>

      {/* Toggle & Filter Controls */}
      <View style={styles.controlsRow}>
        {/* View Mode Toggle */}
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

        {/* Filter Reset */}
        {filterStatus !== 'All' && (
          <TouchableOpacity onPress={() => handleFilterPress('All')} style={styles.resetFilter}>
            <Text style={styles.resetText}>Show All ({reports.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT AREA */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : viewMode === 'list' ? (
        // --- LIST VIEW ---
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No reports found.</Text>}
        />
      ) : (
        // --- MAP VIEW ---
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={region}
            showsUserLocation={true}
          >
            {filteredReports.map((report) => (
              report.latitude && report.longitude ? (
                <Marker
                  key={report.id}
                  coordinate={{
                    latitude: report.latitude,
                    longitude: report.longitude
                  }}
                  pinColor={getStatusColor(report.status)} // Pin color matches status!
                >
                  <Callout onPress={() => navigation.navigate('AdminReportDetails', { report })}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{report.title}</Text>
                      <Text style={[styles.calloutStatus, { color: getStatusColor(report.status) }]}>
                        {report.status}
                      </Text>
                      <Text style={styles.calloutDesc}>Tap to manage</Text>
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
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 15 },
  statBox: { width: '31%', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2, textAlign: 'center' },
  
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
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

  // Map Styles
  mapContainer: { flex: 1, borderRadius: 15, overflow: 'hidden', marginHorizontal: 15, marginBottom: 15 },
  map: { width: '100%', height: '100%' },
  callout: { width: 150, padding: 5, alignItems: 'center' },
  calloutTitle: { fontWeight: 'bold', marginBottom: 2 },
  calloutStatus: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  calloutDesc: { fontSize: 10, color: '#666' }
});