import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // Import Location
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { createReport } from '../../services/reportService';
import { auth } from '../../config/firebaseConfig';

export default function ReportFormScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState(null); // Store GPS coordinates
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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

  // NEW: Function to get GPS Location
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
      
      // Optional: Reverse geocode to get street address automatically
      let address = await Location.reverseGeocodeAsync(location.coords);
      if (address.length > 0) {
        const addr = address[0];
        setLocationText(`${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    }
    setLocationLoading(false);
  };

  const handleSubmit = async () => {
    if (!title || !description || !image || !coords) {
      Alert.alert("Missing Info", "Please fill fields, add photo, and GET LOCATION.");
      return;
    }

    setLoading(true);

    const imageUrl = await uploadImageToCloudinary(image);
    if (!imageUrl) {
      setLoading(false);
      Alert.alert("Error", "Failed to upload image.");
      return;
    }

    const user = auth.currentUser;
    const reportData = {
      title,
      description,
      category: "General",
      location: locationText,
      latitude: coords.latitude,   // Save Latitude
      longitude: coords.longitude, // Save Longitude
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

      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>+ Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} placeholder="Broken Streetlight" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Location</Text>
      <View style={styles.locationRow}>
        <TextInput 
          style={[styles.input, { flex: 1, marginBottom: 0 }]} 
          placeholder="Address" 
          value={locationText}
          onChangeText={setLocationText}
        />
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation} disabled={locationLoading}>
          {locationLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.gpsText}>📍 GPS</Text>}
        </TouchableOpacity>
      </View>
      {coords && <Text style={styles.coordText}>Lat: {coords.latitude.toFixed(4)}, Long: {coords.longitude.toFixed(4)}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Describe the issue..." 
        value={description}
        onChangeText={setDescription}
        multiline numberOfLines={4}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Report</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  placeholder: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  placeholderText: { color: '#888', fontSize: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  buttonDisabled: { backgroundColor: '#95a5a6' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // New styles for location
  locationRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  gpsButton: { backgroundColor: '#27ae60', padding: 12, borderRadius: 8, justifyContent: 'center' },
  gpsText: { color: '#fff', fontWeight: 'bold' },
  coordText: { fontSize: 12, color: '#7f8c8d', marginBottom: 15 }
});