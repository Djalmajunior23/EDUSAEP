import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { triggerN8NAlert } from './n8nService';

export interface FlippedMaterial {
  id?: string;
  classId: string;
  teacherId: string;
  title: string;
  url: string;
  type: 'video' | 'article' | 'podcast';
  assignedAt: string;
  dueDate: string;
  status: 'active' | 'completed';
}

export const addFlippedMaterial = async (material: FlippedMaterial) => {
  const colRef = collection(db, 'flippedMaterials');
  const docRef = await addDoc(colRef, material);
  
  // Trigger n8n webhook so it can notify students via Email or WhatsApp
  await triggerN8NAlert('FlippedClassroomMaterialAdded', { 
    materialId: docRef.id,
    ...material 
  });

  return docRef.id;
};

export const getFlippedMaterialsForClass = async (classId: string) => {
  const colRef = collection(db, 'flippedMaterials');
  const q = query(colRef, where('classId', '==', classId));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlippedMaterial));
};
