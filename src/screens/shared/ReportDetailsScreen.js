import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#27ae60';
      case 'In Progress': return '#f39c12';
      case 'Accepted': return '#3498db';
      case 'Rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Date N/A';
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* --- 1. IMAGE SECTION (BEFORE & AFTER) --- */}
      {report.status === 'Resolved' && report.resolutionImageUrl ? (
        <View style={styles.comparisonContainer}>
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>BEFORE 🏚️</Text>
            <Image source={{ uri: report.imageUrl }} style={styles.halfImage} />
          </View>
          <View style={styles.imageWrapper}>
            <Text style={[styles.imageLabel, { color: '#27ae60' }]}>AFTER ✨</Text>
            <Image source={{ uri: report.resolutionImageUrl }} style={styles.halfImage} />
          </View>
        </View>
      ) : (
        // Standard View for non-resolved reports
        <Image source={{ uri: report.imageUrl }} style={styles.fullImage} />
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>

        <Text style={styles.date}>Reported on: {formatDate(report.createdAt)}</Text>
        {report.updatedAt && (
          <Text style={styles.updateDate}>
            Last Update: {formatDate(report.updatedAt)}
          </Text>
        )}

        <View style={styles.divider} />

        {/* --- 2. DETAILS SECTION --- */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color="#555" />
          <Text style={styles.label}> Location</Text>
        </View>
        <Text style={styles.text}>{report.location}</Text>

        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={20} color="#555" />
          <Text style={styles.label}> Description</Text>
        </View>
        <Text style={styles.text}>{report.description}</Text>

        <View style={styles.divider} />

        {/* --- 3. UPDATES & TIMELINE --- */}
        <Text style={styles.sectionHeader}>📋 Status Updates</Text>

        {/* A. Admin Plan (If Accepted/In Progress) */}
        {(report.planNotes || report.adminNotes) && (
          <View style={[styles.updateBox, styles.adminBox]}>
            <View style={styles.boxHeader}>
              <Ionicons name="construct-outline" size={18} color="#3498db" />
              <Text style={styles.boxTitle}>Admin Plan</Text>
            </View>
            <Text style={styles.boxText}>
              {report.planNotes || report.adminNotes}
            </Text>
          </View>
        )}

        {/* B. Worker Resolution (If Resolved) */}
        {report.resolutionNotes && (
          <View style={[styles.updateBox, styles.resolveBox]}>
            <View style={styles.boxHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
              <Text style={[styles.boxTitle, { color: '#27ae60' }]}>Resolution Note</Text>
            </View>
            <Text style={styles.boxText}>{report.resolutionNotes}</Text>
          </View>
        )}

        {/* C. Rejection Reason (If Rejected) */}
        {report.rejectionReason && (
          <View style={[styles.updateBox, styles.rejectBox]}>
            <View style={styles.boxHeader}>
              <Ionicons name="alert-circle" size={18} color="#e74c3c" />
              <Text style={[styles.boxTitle, { color: '#e74c3c' }]}>Rejection Reason</Text>
            </View>
            <Text style={styles.boxText}>{report.rejectionReason}</Text>
          </View>
        )}

        {/* Fallback if no updates yet */}
        {!report.planNotes && !report.resolutionNotes && !report.rejectionReason && (
          <Text style={styles.noUpdates}>No updates from the team yet.</Text>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Images
  fullImage: { width: '100%', height: 250 },
  comparisonContainer: { flexDirection: 'row', height: 250, borderBottomWidth: 5, borderBottomColor: '#fff' },
  imageWrapper: { flex: 1, position: 'relative' },
  halfImage: { width: '100%', height: '100%' },
  imageLabel: { 
    position: 'absolute', bottom: 10, left: 10, zIndex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, 
    fontWeight: 'bold', fontSize: 12, overflow: 'hidden' 
  },

  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1, marginRight: 10, color: '#2c3e50' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  
  date: { color: '#7f8c8d', fontSize: 13 },
  updateDate: { color: '#27ae60', fontWeight: '600', fontSize: 12, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  text: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 15, paddingLeft: 24 },
  
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  
  // Update Boxes
  updateBox: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  boxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  boxTitle: { fontWeight: 'bold', fontSize: 14, color: '#3498db' },
  boxText: { fontSize: 15, color: '#444', lineHeight: 20 },
  
  adminBox: { backgroundColor: '#f0f8ff', borderColor: '#d6eaf8' },
  resolveBox: { backgroundColor: '#eafaf1', borderColor: '#d5f5e3' },
  rejectBox: { backgroundColor: '#fdedec', borderColor: '#fadbd8' },
  
  noUpdates: { fontStyle: 'italic', color: '#999', textAlign: 'center', marginTop: 10 }
});