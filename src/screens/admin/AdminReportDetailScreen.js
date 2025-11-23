import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import MapView, { Marker } from 'react-native-maps'; 
import { updateReportStatus } from '../../services/reportService';

export default function AdminReportDetailScreen({ route, navigation }) {
  const { report } = route.params;
  
  // State for Modals and Inputs
  const [status, setStatus] = useState(report.status);
  const [modalType, setModalType] = useState(null); // 'plan' or 'reject' or null
  const [inputText, setInputText] = useState('');
  const [saving, setSaving] = useState(false);

  // Open Modals
  const openPlanModal = () => {
    setInputText('');
    setModalType('plan');
  };

  const openRejectModal = () => {
    setInputText('');
    setModalType('reject');
  };

  // Submit Logic
  const handleSubmit = async () => {
    if (!inputText.trim()) {
      Alert.alert("Required", "Please enter details.");
      return;
    }

    setSaving(true);
    let newStatus = '';
    let additionalData = {};

    if (modalType === 'plan') {
      newStatus = 'Accepted';
      additionalData = { planNotes: inputText };
    } else if (modalType === 'reject') {
      newStatus = 'Rejected';
      additionalData = { rejectionReason: inputText };
    }

    const result = await updateReportStatus(report.id, newStatus, additionalData);
    setSaving(false);
    setModalType(null);

    if (result.success) {
      setStatus(newStatus);
      Alert.alert("Success", "Report updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("Error", "Failed to update report.");
    }
  };

  // Render color helper
  const getStatusColor = (s) => {
    switch(s) {
      case 'Resolved': return '#27ae60';
      case 'Accepted': return '#3498db';
      case 'In Progress': return '#f39c12';
      case 'Rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{report.title}</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.badgeText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.date}>Reported: {new Date(report.createdAt.seconds * 1000).toDateString()}</Text>
          
          {/* MAP SECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>📍 Location</Text>
            <Text style={styles.text}>{report.location}</Text>
            {report.latitude && report.longitude ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
                </MapView>
              </View>
            ) : (
              <Text style={styles.noGpsText}>No GPS data available.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>📝 Description</Text>
            <Text style={styles.text}>{report.description}</Text>
          </View>

          <View style={styles.divider} />

          {/* --- ADMIN ACTIONS --- */}
          <Text style={styles.sectionHeader}>Admin Actions</Text>

          {status === 'Pending' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={openRejectModal}>
                <Ionicons name="close-circle-outline" size={24} color="#e74c3c" />
                <Text style={[styles.actionText, { color: '#e74c3c' }]}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.planBtn]} onPress={openPlanModal}>
                <Ionicons name="calendar-outline" size={24} color="#3498db" />
                <Text style={[styles.actionText, { color: '#3498db' }]}>Accept & Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoBox}>
              {status === 'Accepted' && (
                <>
                  <Text style={styles.infoTitle}>✅ Job Planned</Text>
                  <Text style={styles.infoText}>{report.planNotes || "No plan details provided."}</Text>
                  <Text style={styles.waitingText}>Waiting for Worker to start...</Text>
                </>
              )}
              {status === 'Rejected' && (
                <>
                  <Text style={[styles.infoTitle, { color: '#e74c3c' }]}>🚫 Report Rejected</Text>
                  <Text style={styles.infoText}>Reason: {report.rejectionReason || "No reason provided."}</Text>
                </>
              )}
              {status === 'In Progress' && (
                <>
                  <Text style={[styles.infoTitle, { color: '#f39c12' }]}>👷 Worker Active</Text>
                  <Text style={styles.infoText}>Plan: {report.planNotes}</Text>
                </>
              )}
              {status === 'Resolved' && (
                <Text style={[styles.infoTitle, { color: '#27ae60' }]}>🎉 Issue Resolved</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- MODAL FOR INPUT --- */}
      <Modal visible={!!modalType} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'plan' ? '📅 Plan Job / ETA' : '🚫 Reject Report'}
            </Text>
            <Text style={styles.modalSub}>
              {modalType === 'plan' 
                ? 'Enter instructions for the worker and expected timeline.' 
                : 'Please provide a reason for rejecting this report.'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={modalType === 'plan' ? "e.g. Dispatching team tomorrow at 9 AM..." : "e.g. Duplicate report / Not a valid issue..."}
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={setInputText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: modalType === 'plan' ? '#3498db' : '#e74c3c' }]} 
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 200 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  date: { fontSize: 12, color: '#888', marginBottom: 20, marginTop: 5 },
  
  section: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  text: { fontSize: 16, color: '#333', lineHeight: 22, marginBottom: 10 },
  
  mapContainer: { height: 150, borderRadius: 10, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#ddd' },
  map: { width: '100%', height: '100%' },
  noGpsText: { fontStyle: 'italic', color: '#999', marginTop: 5 },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 15 },
  actionBtn: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  rejectBtn: { borderColor: '#e74c3c', backgroundColor: '#fdedec' },
  planBtn: { borderColor: '#3498db', backgroundColor: '#ebf5fb' },
  actionText: { fontWeight: 'bold', fontSize: 16 },

  // Info Box
  infoBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  infoText: { fontSize: 15, color: '#555' },
  waitingText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
  modalInput: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center' },
  cancelText: { color: '#777', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});