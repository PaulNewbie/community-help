import axios from 'axios';
import { Platform } from 'react-native';

// ⚠️ ENSURE THESE ARE CORRECT
const CLOUD_NAME = "dlfjnz8xq"; // Use your actual Cloud Name
const UPLOAD_PRESET = "community_reports"; // Use your actual Upload Preset

export const uploadImageToCloudinary = async (imageUri) => {
  if (!imageUri) return null;

  try {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // 🌐 WEB FIX: Convert URI to Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob);
    } else {
      // 📱 MOBILE LOGIC: Standard React Native FormData
      let filename = imageUri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      formData.append('file', { uri: imageUri, name: filename, type });
    }

    formData.append('upload_preset', UPLOAD_PRESET);

    // Upload to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // On Web, seeing the full error object helps debug
    if (error.response) {
        console.log('Cloudinary Error Details:', error.response.data);
    }
    return null;
  }
};