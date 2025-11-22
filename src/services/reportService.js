import { db } from '../config/firebaseConfig';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

export const createReport = async (userId, reportData) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      userId: userId,
      title: reportData.title,
      description: reportData.description,
      category: reportData.category,
      location: reportData.location, // string for now
      imageUrl: reportData.imageUrl,
      latitude: reportData.latitude || null,
      longitude: reportData.longitude || null,
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

export const getUserReports = async (userId) => {
  try {
    // Query reports where userId matches the current user
    const q = query(
      collection(db, 'reports'), 
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    // Convert to array and sort by date (newest first)
    // Note: We sort in JS to avoid needing a Firestore composite index right now
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, data: reports };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, error: error.message };
  }
};

export const getAllReports = async () => {
  try {
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: reports };
  } catch (error) {
    console.error("Error fetching all reports:", error);
    return { success: false, error: error.message };
  }
};

export const updateReportStatus = async (reportId, newStatus, adminNotes) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: newStatus,
      adminNotes: adminNotes || "",
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating report:", error);
    return { success: false, error: error.message };
  }
};