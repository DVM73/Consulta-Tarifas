
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Esta configuración lee las variables de entorno inyectadas por Vite/Vercel
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db: Firestore | null = null;

// Validación estricta: Comprobamos que existan Y que no sean la cadena "undefined" (común en fallos de build)
const isValidConfig = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'undefined' && 
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'undefined';

if (isValidConfig) {
    try {
        const apps = getApps();
        const app: FirebaseApp = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        console.log("🟢 Firebase Conectado.");
    } catch (e) {
        console.warn("🔴 Error de conexión con Firebase:", e);
    }
} else {
    console.warn("🟡 Firebase no configurado: Faltan variables de entorno o son inválidas.");
    console.warn("Debug Config:", JSON.stringify(firebaseConfig, null, 2));
}

export { db };
