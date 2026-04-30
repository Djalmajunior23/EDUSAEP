import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || config.projectId;
  const databaseId = process.env.FIRESTORE_DATABASE_ID || config.firestoreDatabaseId;

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });

  if (databaseId && databaseId !== '(default)') {
    (admin as any)._db = admin.firestore(databaseId);
  } else {
    (admin as any)._db = admin.firestore();
  }
}

export const db = (admin as any)._db || admin.firestore();
export const auth = admin.auth();
