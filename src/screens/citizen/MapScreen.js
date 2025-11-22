import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { getAllReports } from '../../services/reportService';

export default function MapScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default region (Update this to your city if needed)
  const [region, setRegion] = useState({
    latitude: 14.5995, // Manila coordinates
    longitude: 120.9842,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const fetchReports = async () => {
    const result = await getAllReports();
    if (result.success) {
      // Only show reports that actually have coordinates
      const validReports = result.data.filter(r => r.latitude && r.longitude);
      setReports(validReports);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3498db" /></View>;
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={region}
        showsUserLocation={true} // Show blue dot for user
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude
            }}
            title={report.title}
            description={report.status}
            pinColor={report.status === 'Resolved' ? 'green' : 'red'}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{report.title}</Text>
                <Text style={styles.calloutStatus}>{report.status}</Text>
                <Text style={styles.calloutDesc}>{report.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callout: { width: 150, padding: 5 },
  calloutTitle: { fontWeight: 'bold', marginBottom: 5 },
  calloutStatus: { color: '#e74c3c', fontSize: 12, marginBottom: 2 },
  calloutDesc: { fontSize: 10, color: '#666' }
});