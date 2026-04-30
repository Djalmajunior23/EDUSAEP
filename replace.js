import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes('admin.firestore()') && !fullPath.includes('customDb.ts')) {
        // Find import admin from 'firebase-admin';
        if (content.includes("import admin from 'firebase-admin';")) {
          content = content.replace("import admin from 'firebase-admin';", "import { admin, dbAdmin } from '../customDb'; // Adjust path\nimport adminFirebase from 'firebase-admin';");
        }
      }
    }
  }
}
