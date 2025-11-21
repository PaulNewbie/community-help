import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { createReport } from '../services/reportService';
import { auth } from '../services/firebaseConfig'; // To get current user ID

export default function ReportFormScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Pick Image Function
  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Updated: use an array of media types
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress image slightly
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Submit Function
  const handleSubmit = async () => {
    if (!title || !description || !location || !image) {
      Alert.alert("Missing Info", "Please fill all fields and add a photo.");
      return;
    }

    setLoading(true);

    // Step A: Upload Image
    const imageUrl = await uploadImageToCloudinary(image);
    if (!imageUrl) {
      setLoading(false);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return;
    }

    // Step B: Save Report to Firestore
    const user = auth.currentUser;
    const reportData = {
      title,
      description,
      category: "General", // Hardcoded for now, can add a dropdown later
      location,
      imageUrl
    };

    const result = await createReport(user.uid, reportData);

    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Report submitted successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
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

      <Text style={styles.label}>Title</Text>
      <TextInput 
        style={styles.input} 
        placeholder="E.g., Broken Streetlight" 
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput 
        style={styles.input} 
        placeholder="E.g., Main St. near 7-Eleven" 
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Describe the issue..." 
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});