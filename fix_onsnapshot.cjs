const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(docs);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDiags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allDiags.filter((d: any) => 
        d.studentId === user.uid || 
        (d.studentEmail && d.studentEmail.toLowerCase() === user.email?.toLowerCase()) ||
        (d.aluno && d.aluno.toLowerCase() === user.displayName?.toLowerCase())
      );
      
      setDiagnostics(filtered);
      setLoading(false);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDiags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allDiags.filter((d: any) => 
        d.studentId === user.uid || 
        (d.studentEmail && d.studentEmail.toLowerCase() === user.email?.toLowerCase()) ||
        (d.aluno && d.aluno.toLowerCase() === user.displayName?.toLowerCase())
      );
      
      setDiagnostics(filtered);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'diagnostics');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(questionsData);
      setLoading(false);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(questionsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'questions');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discipline));
      setDisciplines(data);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discipline));
      setDisciplines(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'disciplines');
    });`
  },
  {
    target: `    const unsubscribeExams = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExercises(data);
    });`,
    replacement: `    const unsubscribeExams = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExercises(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });`
  },
  {
    target: `    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
      setLoading(false);
    });`,
    replacement: `    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });`
  },
  {
    target: `    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    });`,
    replacement: `    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });`
  },
  {
    target: `    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
    });`,
    replacement: `    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });`
  },
  {
    target: `    const unsubscribeForms = onSnapshot(formsQuery, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimuladoForm));
      setForms(formsData);
      setLoading(false);
    });`,
    replacement: `    const unsubscribeForms = onSnapshot(formsQuery, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimuladoForm));
      setForms(formsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'simulado_forms');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudyPlan);
      }
      setLoading(false);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudyPlan);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'study_plans');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(docs);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'messages');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
    });`,
    replacement: `    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure Djalma is always an admin in the frontend, even if the DB hasn't updated yet
        if (user.email === 'djalmabatistajunior@gmail.com') {
          data.role = 'admin';
        }
        setUserProfile(data);
      }
      setLoading(false);
    });`,
    replacement: `    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure Djalma is always an admin in the frontend, even if the DB hasn't updated yet
        if (user.email === 'djalmabatistajunior@gmail.com') {
          data.role = 'admin';
        }
        setUserProfile(data);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, \`users/\${user.uid}\`);
    });`
  },
  {
    target: `    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.data());
      }
    }, (err) => {
      console.error("Error listening to global settings:", err);
    });`,
    replacement: `    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.data());
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/global');
    });`
  }
];

let changed = false;
for (const { target, replacement } of replacements) {
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    changed = true;
  } else {
    console.log("Could not find target:", target.substring(0, 50) + "...");
  }
}

if (changed) {
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Successfully updated App.tsx");
} else {
  console.log("No changes made.");
}
