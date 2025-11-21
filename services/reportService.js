import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const createReport = async (userId, reportData) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      userId: userId,
      title: reportData.title,
      description: reportData.description,
      category: reportData.category,
      location: reportData.location, // string for now
      imageUrl: reportData.imageUrl,
      status: 'Pending', // Default status
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding report: ", error);
    return { success: false, error: error.message };
  }
};