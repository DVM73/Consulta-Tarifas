
import { AppData } from '../types';
import { db } from './firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    getDocs, 
    collection, 
    Timestamp as FirestoreTimestamp 
} from "firebase/firestore";
import { usuariosRawData } from '../data/usuarios';
import { articulosRawData } from '../data/articulos';
import { tarifasRawData } from '../data/tarifas';

const DATA_KEY = 'appData';
const DB_NAME = 'ConsultaTarifasDB_v9'; 
const STORE_NAME = 'appDataStore';

let appDataPromise: Promise<AppData> | null = null;
let dbInstance: IDBDatabase | null = null;

// --- INDEXED DB HELPERS (Caché Local) ---

const openDB = (): Promise<IDBDatabase> => {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };
        request.onerror = () => reject(request.error);
    });
};

const dbGet = async (key: string): Promise<any> => {
    try {
        const idb = await openDB();
        return new Promise((res, rej) => {
            const tx = idb.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
            tx.onsuccess = () => res(tx.result);
            tx.onerror = () => rej(tx.error);
        });
    } catch (e) {
        console.warn("Error leyendo IndexedDB:", e);
        return null;
    }
};

const dbPut = async (key: string, value: any): Promise<void> => {
    try {
        const idb = await openDB();
        return new Promise((res, rej) => {
            const tx = idb.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(value, key);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    } catch (e) {
        console.warn("Error escribiendo IndexedDB:", e);
    }
};

// --- DATA SANITIZATION ---

const sanitizeAppData = (data: any): AppData => {
    const s = (v: any) => String(v || '').trim();
    return {
        users: data.users?.map((u: any) => ({...u, id: s(u.id || Math.random()), nombre: s(u.nombre)})) || [],
        pos: data.pos?.map((p: any) => ({...p, id: s(p.id || Math.random()), zona: s(p.zona)})) || [],
        articulos: data.articulos || [],
        tarifas: data.tarifas || [],
        groups: data.groups || [],
        companyName: s(data.companyName) || "Paraíso de la Carne Selección, S.L.U.",
        notificationEmail: s(data.notificationEmail),
        lastUpdated: s(data.lastUpdated) || new Date().toLocaleString(),
        reports: data.reports || [],
        backups: data.backups || [],
    };
};

// --- MAIN LOAD FUNCTION ---

async function loadAndInitializeData(): Promise<AppData> {
    // 1. CARGA DIRECTA DE FIREBASE (Prioridad Absoluta)
    if (db) {
        try {
            console.log("🌐 Conectando directamente a Firebase (Modo Producción)...");
            
            // Intentar leer las colecciones individuales primero (Estructura "Real")
            const [usersSnap, posSnap, artSnap, tarSnap, groupSnap, mainDocSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "pos")),
                getDocs(collection(db, "articulos")),
                getDocs(collection(db, "tarifas")),
                getDocs(collection(db, "groups")),
                getDoc(doc(db, "appData", "main")) // Configuración global
            ]);

            // Si hay datos en colecciones, usarlos
            if (!usersSnap.empty || !artSnap.empty || !posSnap.empty) {
                console.log(`✅ Datos obtenidos de Firebase: ${artSnap.size} artículos, ${tarSnap.size} tarifas.`);
                
                const cloudData: any = {
                    users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    pos: posSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    articulos: artSnap.docs.map(d => d.data()),
                    tarifas: tarSnap.docs.map(d => d.data()),
                    groups: groupSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    // Si existe el documento principal para metadatos, úsalo, si no, fecha actual
                    ...(mainDocSnap.exists() ? mainDocSnap.data() : {}),
                    lastUpdated: new Date().toLocaleString()
                };

                const sanitized = sanitizeAppData(cloudData);
                await dbPut(DATA_KEY, sanitized); // Refrescar caché local
                return sanitized;
            }

            // Si colecciones están vacías, intentar documento "main" monolítico (Legacy)
            if (mainDocSnap.exists()) {
                console.log("⚠️ Usando documento 'main' monolítico (Legacy).");
                const mainData = sanitizeAppData(mainDocSnap.data());
                await dbPut(DATA_KEY, mainData);
                return mainData;
            }

        } catch (e) {
            console.error("❌ Error CRÍTICO conectando a Firebase (posible falta de permisos o error de red):", e);
            // Si hay error, pasamos al fallback local
        }
    } else {
        console.warn("⚠️ Firebase DB no inicializada. Revisa las variables de entorno.");
    }

    // 2. FALLBACK A CACHÉ LOCAL (OFFLINE REAL)
    const cachedLocal = await dbGet(DATA_KEY);
    if (cachedLocal && cachedLocal.users && cachedLocal.users.length > 0) {
        console.log("📂 Usando datos en caché local (Offline).");
        return sanitizeAppData(cachedLocal);
    }

    // 3. ESTADO DEMO (Sin conexión y Sin caché)
    // En lugar de "Sistema Vacío", cargamos los datos de prueba importados.
    console.log("⚠️ Usando DATOS DEMO (Modo Presentación).");

    const demoData = sanitizeAppData({
        users: usuariosRawData.users,
        pos: usuariosRawData.pos,
        groups: usuariosRawData.groups,
        articulos: articulosRawData,
        tarifas: tarifasRawData,
        companyName: "Paraíso de la Carne (DEMO)",
        lastUpdated: "Datos de Demostración"
    });
    
    // Guardamos la demo en caché para que la próxima carga sea más rápida
    await dbPut(DATA_KEY, demoData);
    
    return demoData;
}

export function getAppData(): Promise<AppData> {
    if (!appDataPromise) appDataPromise = loadAndInitializeData();
    return appDataPromise;
}

export async function saveAllData(updates: Partial<AppData>): Promise<void> {
    const current = await getAppData();
    const now = Date.now();
    const updated = sanitizeAppData({ ...current, ...updates, lastUpdated: new Date().toLocaleString() });
    
    // 1. Guardar en Caché Local
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);

    // 2. Guardar en Firebase DIRECTAMENTE en colecciones
    if (db) {
        try {
            console.log("☁️ Guardando datos en Firebase...");
            
            // Guardamos siempre en el documento principal por seguridad/backup rápido
            await setDoc(doc(db, "appData", "main"), { 
                ...updated, 
                serverTimestamp: FirestoreTimestamp.fromMillis(now) 
            });
            
            console.log("✅ Datos sincronizados.");
        } catch (e) {
            console.error("❌ Error guardando en Firebase:", e);
            // No mostramos alerta si sabemos que no hay configuración
            // alert("Error de conexión al guardar en la nube. Los datos se han guardado localmente.");
        }
    } else {
        console.log("💾 Guardado local (Modo Demo/Offline).");
    }
}

export async function overwriteAllData(newData: AppData): Promise<void> {
    const now = Date.now();
    const updated = sanitizeAppData({ ...newData, lastUpdated: new Date().toLocaleString() });
    
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);
    
    if (db) {
        try {
            await setDoc(doc(db, "appData", "main"), { 
                ...updated, 
                serverTimestamp: FirestoreTimestamp.fromMillis(now) 
            });
        } catch (e) {
            console.warn("Error sobrescribiendo en nube:", e);
        }
    }
}