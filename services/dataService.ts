
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

// Datos semilla por si falla todo lo demás
import { usuariosRawData } from '../data/usuarios';
import { articulosRawData } from '../data/articulos';
import { tarifasRawData } from '../data/tarifas';

const DATA_KEY = 'appData';
const DB_NAME = 'ConsultaTarifasDB_v9'; 
const STORE_NAME = 'appDataStore';
const LOCAL_UPDATED_KEY = 'appData_last_local_update';

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
    // 1. INTENTO DE CARGA DESDE FIREBASE (NUBE)
    // Prioridad: 1. Documento único (Sync) -> 2. Colecciones separadas (Manual)
    if (db) {
        try {
            console.log("🌐 Conectando con Firebase...");
            
            // A. Buscar Documento Monolítico (Formato nativo de la App)
            const mainDocRef = doc(db, "appData", "main");
            const mainDocSnap = await getDoc(mainDocRef);

            if (mainDocSnap.exists()) {
                console.log("✅ Datos encontrados en documento 'main'.");
                const cloudData = sanitizeAppData(mainDocSnap.data());
                
                // Actualizamos la caché local
                await dbPut(DATA_KEY, cloudData);
                localStorage.setItem(LOCAL_UPDATED_KEY, Date.now().toString());
                return cloudData;
            } 
            
            // B. Buscar Colecciones Individuales (Si el usuario subió datos manualmente)
            console.log("⚠️ Documento 'main' no encontrado. Buscando colecciones individuales...");
            
            const [usersSnap, posSnap, artSnap, tarSnap, groupSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "pos")),
                getDocs(collection(db, "articulos")),
                getDocs(collection(db, "tarifas")),
                getDocs(collection(db, "groups"))
            ]);

            const hasCollections = !usersSnap.empty || !artSnap.empty || !posSnap.empty;

            if (hasCollections) {
                console.log("✅ Colecciones encontradas. Importando datos...");
                
                const collectionData: any = {
                    users: usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
                    pos: posSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
                    articulos: artSnap.docs.map(d => d.data()),
                    tarifas: tarSnap.docs.map(d => d.data()),
                    groups: groupSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
                    lastUpdated: new Date().toLocaleString()
                };

                const consolidatedData = sanitizeAppData(collectionData);
                
                // Guardamos en local
                await dbPut(DATA_KEY, consolidatedData);
                localStorage.setItem(LOCAL_UPDATED_KEY, Date.now().toString());
                
                // Opcional: Crear el documento 'main' para la próxima vez sea más rápido
                // await setDoc(mainDocRef, consolidatedData); 
                
                return consolidatedData;
            } else {
                console.log("⚠️ No se encontraron colecciones en Firebase.");
            }

        } catch (e) {
            console.error("❌ Error al obtener datos de Firebase (Verifica permisos/conexión):", e);
            // Si falla Firebase, continuamos al fallback local
        }
    } else {
        console.warn("⚠️ Servicio Firebase no inicializado (Faltan claves).");
    }

    // 2. FALLBACK A CACHÉ LOCAL (OFFLINE)
    const cachedLocal = await dbGet(DATA_KEY);
    if (cachedLocal) {
        console.log("📂 Usando datos en caché local.");
        return sanitizeAppData(cachedLocal);
    }

    // 3. FALLBACK A DATOS SEMILLA (SOLO SI NO HAY NADA MÁS)
    console.log("⚠️ Inicializando con datos de demostración (Local Mode).");
    const initial = sanitizeAppData({
        users: usuariosRawData.users,
        pos: usuariosRawData.pos,
        articulos: articulosRawData,
        tarifas: tarifasRawData,
        groups: [...new Set(usuariosRawData.pos.map(p => p.grupo))].map(g => ({ id: g, nombre: g }))
    });
    
    await dbPut(DATA_KEY, initial);
    return initial;
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
    localStorage.setItem(LOCAL_UPDATED_KEY, now.toString());
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);

    // 2. Guardar en Firebase (Documento Único para sincronización rápida)
    if (db) {
        try {
            await setDoc(doc(db, "appData", "main"), { 
                ...updated, 
                serverTimestamp: FirestoreTimestamp.fromMillis(now) 
            });
            console.log("☁️ Datos sincronizados con Firebase.");
        } catch (e) {
            console.error("❌ Error guardando en Firebase:", e);
        }
    }
}

export async function overwriteAllData(newData: AppData): Promise<void> {
    const now = Date.now();
    const updated = sanitizeAppData({ ...newData, lastUpdated: new Date().toLocaleString() });
    
    localStorage.setItem(LOCAL_UPDATED_KEY, now.toString());
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);
    
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
    }
    
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
