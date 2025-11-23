import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ScrollView, Alert, ActivityIndicator, Modal, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { createReport } from '../../services/reportService';
import { auth } from '../../config/firebaseConfig';

const COMMON_ISSUES = [
  "Broken Streetlight", "Pothole / Lubak", "Uncollected Garbage", 
  "Clogged Drainage", "Water Leak", "Busted Pipe", "Noise Complaint", 
  "Stray Animal", "Illegal Parking", "Fallen Tree", "Others"
];

export default function ReportFormScreen({ navigation }) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState(''); 
  const [landmark, setLandmark] = useState('');         
  
  // System State
  const [coords, setCoords] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); 

  // --- MAP PICKER STATE ---
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.7566, // Marilao, Bulacan
    longitude: 120.9466,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [addressLoading, setAddressLoading] = useState(false);

  const openMapPicker = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow location access to use the map.');
      return;
    }
    
    try {
      let location = await Location.getCurrentPositionAsync({});
      setMapRegion({
        ...mapRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      // Keep default Marilao if GPS fails
    }
    setMapVisible(true);
  };

  const onRegionChangeComplete = (region) => {
    setMapRegion(region);
  };

  const confirmLocation = async () => {
    setAddressLoading(true);
    try {
      let addressResponse = await Location.reverseGeocodeAsync({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const street = addr.street || '';
        const name = addr.name || '';
        const city = addr.city || '';
        const fullAddress = street ? `${street}, ${city}` : `${name}, ${city}`;
        setLocationText(fullAddress.replace(/^, /, '').trim());
      } else {
        setLocationText(`${mapRegion.latitude.toFixed(5)}, ${mapRegion.longitude.toFixed(5)}`);
      }

      setCoords({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude
      });
      
      setMapVisible(false);
    } catch (error) {
      setLocationText(`${mapRegion.latitude.toFixed(5)}, ${mapRegion.longitude.toFixed(5)}`);
      setCoords({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude
      });
      setMapVisible(false);
    }
    setAddressLoading(false);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) return;
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

      {/* 1. LOCATION SECTION (Top) */}
      <Text style={styles.label}>Location</Text>
      
      <TouchableOpacity style={styles.mapPreviewContainer} onPress={openMapPicker}>
        <MapView
          style={styles.mapPreview}
          region={coords ? { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 } : mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          pointerEvents="none"
        >
          {coords && <Marker coordinate={coords} />}
        </MapView>
        
        {!coords && (
          <View style={styles.mapOverlay}>
            <Ionicons name="pin" size={24} color="#e67e22" />
            <Text style={styles.mapOverlayText}>Tap to Pin Location</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.addressBox}>
        <Ionicons name="location" size={20} color={coords ? "#e74c3c" : "#999"} />
        <Text style={styles.addressText}>
          {locationText || "No location selected yet."}
        </Text>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Specific Landmark (optional)" 
        value={landmark} 
        onChangeText={setLandmark} 
      />

      {/* 2. IMAGE REPORT (Below Location) */}
      <Text style={styles.label}>Evidence Photo</Text>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={40} color="#888" />
            <Text style={styles.placeholderText}>Tap to add proof photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 3. ISSUE TYPE */}
      <Text style={styles.label}>Issue Type</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={title ? styles.selectorText : styles.placeholderText}>
          {title || "Select Issue..."}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* 4. DESCRIPTION */}
      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Describe the details..." 
        value={description}
        onChangeText={setDescription}
        multiline numberOfLines={4}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Report</Text>}
      </TouchableOpacity>

      {/* --- MODALS --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Issue</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COMMON_ISSUES}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setTitle(item); setModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.fullMapContainer}>
          <MapView
            style={styles.fullMap}
            initialRegion={mapRegion}
            onRegionChangeComplete={onRegionChangeComplete}
          />
          <View style={styles.markerFixed}>
            <Ionicons name="location" size={48} color="#e74c3c" />
          </View>
          <View style={styles.mapFooter}>
            <Text style={styles.mapInstruction}>Drag map to position the pin</Text>
            <TouchableOpacity style={styles.confirmLocationBtn} onPress={confirmLocation} disabled={addressLoading}>
              {addressLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmLocationText}>Confirm Location</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelMapBtn} onPress={() => setMapVisible(false)}>
              <Text style={styles.cancelMapText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333', marginTop: 10 },
  
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15 },
  selectorText: { fontSize: 16, color: '#333' },
  
  imageContainer: { alignItems: 'center', marginBottom: 15 },
  placeholder: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  placeholderText: { color: '#888', fontSize: 14, marginTop: 5 },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  
  mapPreviewContainer: { height: 150, borderRadius: 10, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: '#ddd', position: 'relative' },
  mapPreview: { width: '100%', height: '100%' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  mapOverlayText: { fontWeight: 'bold', color: '#e67e22', marginTop: 5 },
  
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  addressText: { marginLeft: 10, flex: 1, color: '#333', fontSize: 14 },

  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  buttonDisabled: { backgroundColor: '#95a5a6' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  fullMapContainer: { flex: 1, backgroundColor: '#fff' },
  fullMap: { flex: 1 },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48 },
  mapFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  mapInstruction: { textAlign: 'center', marginBottom: 15, color: '#666', fontWeight: '500' },
  confirmLocationBtn: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  confirmLocationText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelMapBtn: { padding: 15, alignItems: 'center' },
  cancelMapText: { color: '#e74c3c', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { fontSize: 16, color: '#333' }
});