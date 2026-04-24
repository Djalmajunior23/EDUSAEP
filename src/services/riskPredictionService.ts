import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const riskPredictionService = {
  async predictRisk(userId: string) {
    // 1. Fetch data
    const userDoc = await getDoc(doc(db, "UserProfile", userId));
    const userData = userDoc.data();
    
    // Fetch analytics/activities (simplified aggregation)
    const submissions = await getDocs(query(collection(db, "LabSubmission"), where("studentId", "==", userId)));
    const submissionsData = submissions.docs.map(d => d.data());

    // 2. Prepare payload
    const data = {
        student: userData?.displayName,
        submissions: submissionsData.length,
        // ... add other relevant stats
    };

    // 3. Call server AI endpoint
    const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: JSON.stringify(data),
            systemInstruction: "You are an expert pedagogical AI. Analyze student data for evasion risk (0-100 score). Include a 'learningPace' classification (rápido, moderado, lento) and 'workloadAdjustment' suggestions.",
            task: "risk_and_pace_prediction",
            userId: userId,
            userRole: "STUDENT"
        })
    });

    return await response.json();
  }
};
