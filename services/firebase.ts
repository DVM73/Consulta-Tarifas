
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Acceso directo a las claves configuradas en el entorno o en el objeto global
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || (window as any).process?.env?.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || (window as any).process?.env?.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || (window as any).process?.env?.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (window as any).process?.env?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || (window as any).process?.env?.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || (window as any).process?.env?.FIREBASE_APP_ID
};

let db: Firestore | null = null;

try {
    const hasConfig = firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "undefined" && 
                     firebaseConfig.projectId && 
                     firebaseConfig.projectId !== "undefined";

    if (hasConfig) {
        const apps = getApps();
        const app: FirebaseApp = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        console.log("🟢 Firebase: Motor de base de datos conectado.");
    } else {
        console.warn("🟡 Firebase: Claves no detectadas. Operando en modo Local Storage.");
    }
} catch (e) {
    console.warn("🔴 Firebase: Error de conexión, usando almacenamiento local.", e);
    db = null;
}

export { db };