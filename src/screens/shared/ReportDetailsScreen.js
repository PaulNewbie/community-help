import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60';
      case 'In Progress': return '#f39c12';
      default: return '#e74c3c';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Date N/A';
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: report.imageUrl }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>

        <Text style={styles.date}>
          Reported on: {formatDate(report.createdAt)}
        </Text>

        <Text style={styles.updateDate}>
            {report.status === 'Resolved' ? 'Resolved on: ' : 'Last Update: '} 
            {formatDate(report.updatedAt)}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>📍 Location</Text>
        <Text style={styles.text}>{report.location}</Text>

        <Text style={styles.label}>📝 Description</Text>
        <Text style={styles.text}>{report.description}</Text>

        {!!report.adminNotes && (
          <View style={styles.adminBox}>
            <Text style={styles.adminLabel}>Admin Response:</Text>
            <Text style={styles.adminText}>{report.adminNotes}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 300 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 24, fontWeight: 'bold', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  date: { color: '#7f8c8d', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' },
  text: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 20 },
  adminBox: { backgroundColor: '#f0f8ff', padding: 15, borderRadius: 10, marginTop: 10, borderLeftWidth: 4, borderLeftColor: '#3498db' },
  adminLabel: { fontWeight: 'bold', color: '#2980b9', marginBottom: 5 },
  adminText: { color: '#34495e' },
  updateDate: { color: '#27ae60', fontWeight: '600', fontSize: 12, marginTop: 4}
});