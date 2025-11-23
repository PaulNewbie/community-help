import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ScrollView, Alert, ActivityIndicator, Modal, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { createReport } from '../../services/reportService';
import { auth } from '../../config/firebaseConfig';

// 📋 COMMON ISSUES DATA
const COMMON_ISSUES = [
  "Broken Streetlight",
  "Pothole / Lubak",
  "Uncollected Garbage",
  "Clogged Drainage",
  "Water Leak",
  "Busted Pipe",
  "Noise Complaint",
  "Stray Animal",
  "Illegal Parking",
  "Fallen Tree",
  "Others"
];

export default function ReportFormScreen({ navigation }) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState(''); // Main Address
  const [landmark, setLandmark] = useState('');         // Specific Notes
  
  // System State
  const [coords, setCoords] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // For Title Dropdown

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      let address = await Location.reverseGeocodeAsync(location.coords);
      if (address.length > 0) {
        const addr = address[0];
        const street = addr.street || '';
        const name = addr.name || '';
        const city = addr.city || '';
        const fullAddress = street === name ? `${street}, ${city}` : `${name} ${street}, ${city}`;
        setLocationText(fullAddress.trim());
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    }
    setLocationLoading(false);
  };

  const handleSelectIssue = (issue) => {
    setTitle(issue);
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!title || !description || !image || !locationText) {
      Alert.alert("Missing Info", "Please fill title, description, location, and add a photo.");
      return;
    }

    setLoading(true);

    const imageUrl = await uploadImageToCloudinary(image);
    if (!imageUrl) {
      setLoading(false);
      Alert.alert("Error", "Failed to upload image.");
      return;
    }

    const finalLocation = landmark ? `${locationText} (${landmark})` : locationText;
    const user = auth.currentUser;
    
    const reportData = {
      title,
      description,
      category: "General",
      location: finalLocation,
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null,
      imageUrl
    };

    const result = await createReport(user.uid, reportData);
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Report submitted!", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>New Report</Text>

      {/* Image Picker */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>+ Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 📝 Title Input with Dropdown */}
      <Text style={styles.label}>Issue Type</Text>
      <View style={styles.inputWithIconContainer}>
        <TextInput 
          style={styles.inputWithIcon} 
          placeholder="Select or Type Issue..." 
          value={title} 
          onChangeText={setTitle} 
        />
        <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 📍 Location Section */}
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationRow}>
        <TextInput 
          style={[styles.input, { flex: 1, marginBottom: 0 }]} 
          placeholder="Address (or click GPS)" 
          value={locationText}
          onChangeText={setLocationText}
        />
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation} disabled={locationLoading}>
          {locationLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.gpsText}>📍 GPS</Text>}
        </TouchableOpacity>
      </View>

      {coords && (
        <Text style={styles.coordText}>
          Lat: {coords.latitude.toFixed(5)}, Long: {coords.longitude.toFixed(5)}
        </Text>
      )}

      {/* Landmark Notes */}
      <TextInput 
        style={[styles.input, { marginTop: 10 }]} 
        placeholder="Specific Landmark / Notes (e.g. Near 7-11)" 
        value={landmark} 
        onChangeText={setLandmark} 
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Describe the issue details..." 
        value={description}
        onChangeText={setDescription}
        multiline numberOfLines={4}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Report</Text>}
      </TouchableOpacity>

      {/* 👇 Title Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Common Issue</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COMMON_ISSUES}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => handleSelectIssue(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  
  // Standard Input
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  
  // Input with Dropdown Icon
  inputWithIconContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  inputWithIcon: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', padding: 12, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, fontSize: 16 },
  iconButton: { backgroundColor: '#eee', padding: 13, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderLeftWidth: 0, borderColor: '#ddd' },

  textArea: { height: 100, textAlignVertical: 'top' },
  
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  placeholder: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  placeholderText: { color: '#888', fontSize: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  buttonDisabled: { backgroundColor: '#95a5a6' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  locationRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  gpsButton: { backgroundColor: '#27ae60', padding: 12, borderRadius: 8, justifyContent: 'center' },
  gpsText: { color: '#fff', fontWeight: 'bold' },
  coordText: { fontSize: 12, color: '#7f8c8d', marginBottom: 5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { fontSize: 16, color: '#333' }
});