import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

export async function exportStudentsToCSV(): Promise<void> {
  try {
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
    const students = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const csv = Papa.unparse(students);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'alunos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
}
