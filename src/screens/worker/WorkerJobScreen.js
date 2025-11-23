import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps'; // <--- IMPORT MAP
import { Ionicons } from '@expo/vector-icons';
import { updateReportStatus } from '../../services/reportService';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';

export default function WorkerJobScreen({ route, navigation }) {
  const { report } = route.params;
  const [status, setStatus] = useState(report.status);
  const [loading, setLoading] = useState(false);
  
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofImage, setProofImage] = useState(null);

  // Default to Marilao if no specific coords (Safety fallback)
  const initialRegion = {
    latitude: report.latitude || 14.7566,
    longitude: report.longitude || 120.9466,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const handleStartJob = async () => {
    setLoading(true);
    const result = await updateReportStatus(report.id, 'In Progress');
    setLoading(false);
    if (result.success) {
      setStatus('In Progress');
      Alert.alert('Job Started', 'You have officially started this job.');
    } else {
      Alert.alert('Error', 'Could not start job.');
    }
  };

  const pickProofImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleCompleteJob = async () => {
    if (!proofImage || !resolutionNote) {
      Alert.alert('Requirement Missing', 'You must upload a proof photo and write a final note.');
      return;
    }

    setLoading(true);
    
    const imageUrl = await uploadImageToCloudinary(proofImage);
    if (!imageUrl) {
      setLoading(false);
      Alert.alert('Upload Failed', 'Could not upload the image.');
      return;
    }

    const additionalData = {
      resolutionNotes: resolutionNote,
      resolutionImageUrl: imageUrl
    };

    const result = await updateReportStatus(report.id, 'Resolved', additionalData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Great Work!', 'Job marked as resolved.', [
        { text: 'Back to Queue', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: report.imageUrl }} style={styles.heroImage} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.status}>{status.toUpperCase()}</Text>
        </View>
        
        {/* --- LOCATION SECTION WITH MAP --- */}
        <Text style={styles.sectionTitle}>📍 Location</Text>
        <Text style={styles.text}>{report.location}</Text>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            scrollEnabled={false} // Keep it static so they don't accidentally scroll the map instead of the page
          >
            {report.latitude && report.longitude && (
              <Marker 
                coordinate={{ latitude: report.latitude, longitude: report.longitude }} 
                title={report.title}
              />
            )}
          </MapView>
        </View>

        <Text style={styles.sectionTitle}>📝 Issue Description</Text>
        <Text style={styles.text}>{report.description}</Text>

        <View style={styles.adminBox}>
          <Text style={styles.adminLabel}>👷 Admin Instructions:</Text>
          <Text style={styles.text}>{report.planNotes || "No specific instructions."}</Text>
        </View>

        <View style={styles.divider} />

        {status === 'Accepted' ? (
          <TouchableOpacity style={styles.startBtn} onPress={handleStartJob} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🚀 Start Job</Text>}
          </TouchableOpacity>
        ) : status === 'In Progress' ? (
          <View style={styles.resolutionForm}>
            <Text style={styles.formTitle}>Complete Job</Text>
            
            <Text style={styles.label}>1. Proof of Resolve (Photo)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickProofImage}>
              {proofImage ? (
                <Image source={{ uri: proofImage }} style={styles.preview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={30} color="#888" />
                  <Text style={styles.uploadText}>Tap to Take Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>2. Resolution Notes</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Describe what you fixed..." 
              multiline 
              value={resolutionNote}
              onChangeText={setResolutionNote}
            />

            <TouchableOpacity style={styles.resolveBtn} onPress={handleCompleteJob} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Mark as Resolved</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedBox}>
            <Ionicons name="checkmark-circle" size={40} color="#27ae60" />
            <Text style={styles.completedText}>This job is completed.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heroImage: { width: '100%', height: 250 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  status: { fontWeight: 'bold', color: '#8e44ad', fontSize: 14 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 15, marginBottom: 5 },
  text: { fontSize: 16, color: '#333', lineHeight: 22 },
  
  // Map Styles
  mapContainer: { height: 150, borderRadius: 10, overflow: 'hidden', marginTop: 5, borderWidth: 1, borderColor: '#ddd' },
  map: { width: '100%', height: '100%' },

  adminBox: { backgroundColor: '#fffcf5', padding: 15, borderRadius: 8, marginTop: 20, borderWidth: 1, borderColor: '#fae588' },
  adminLabel: { fontSize: 14, fontWeight: 'bold', color: '#f39c12', marginBottom: 5 },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 25 },
  
  startBtn: { backgroundColor: '#2c3e50', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  resolutionForm: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  
  imagePicker: { height: 150, backgroundColor: '#e1e1e1', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { color: '#666', marginTop: 5 },
  preview: { width: '100%', height: '100%' },
  
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#ddd' },
  
  resolveBtn: { backgroundColor: '#27ae60', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  
  completedBox: { alignItems: 'center', padding: 20 },
  completedText: { fontSize: 18, fontWeight: 'bold', color: '#27ae60', marginTop: 10 }
});