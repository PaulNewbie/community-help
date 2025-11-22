import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { updateReportStatus } from '../../services/reportService';

export default function AdminReportDetailScreen({ route, navigation }) {
  const { report } = route.params;
  
  const [status, setStatus] = useState(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateReportStatus(report.id, status, adminNotes);
    setSaving(false);

    if (result.success) {
      Alert.alert("Success", "Report updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("Error", "Failed to update report.");
    }
  };

  const StatusButton = ({ label, value, color }) => (
    <TouchableOpacity 
      style={[
        styles.statusBtn, 
        { backgroundColor: status === value ? color : '#f0f0f0' },
        status === value && styles.statusBtnActive
      ]}
      onPress={() => setStatus(value)}
    >
      <Text style={[styles.statusBtnText, { color: status === value ? '#fff' : '#333' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.date}>Reported on: {new Date(report.createdAt.seconds * 1000).toDateString()}</Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>📍 Location</Text>
            <Text style={styles.text}>{report.location}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>📝 Description</Text>
            <Text style={styles.text}>{report.description}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Admin Actions</Text>
          
          <Text style={styles.label}>Update Status</Text>
          <View style={styles.statusContainer}>
            <StatusButton label="Pending" value="Pending" color="#e74c3c" />
            <StatusButton label="In Progress" value="In Progress" color="#f39c12" />
            <StatusButton label="Resolved" value="Resolved" color="#27ae60" />
          </View>

          <Text style={styles.label}>Admin Notes</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Add notes about the resolution..."
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 250 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 12, color: '#888', marginBottom: 20 },
  section: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  text: { fontSize: 16, color: '#333', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statusBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  statusBtnActive: { elevation: 3 },
  statusBtnText: { fontWeight: 'bold', fontSize: 12 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },
  saveButton: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#95a5a6' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});