
import { User, PointOfSale, Articulo, Tarifa, Group, AppData, Report, Backup } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

import { usuariosRawData } from '../data/usuarios';
import { articulosRawData } from '../data/articulos';
import { tarifasRawData } from '../data/tarifas';

const DATA_KEY = 'appData';
const DB_NAME = 'ConsultaTarifasDB_v8'; 
const STORE_NAME = 'appDataStore';
const LOCAL_UPDATED_KEY = 'appData_last_local_update';

let appDataPromise: Promise<AppData> | null = null;
let dbInstance: IDBDatabase | null = null;

const openDB = async (): Promise<IDBDatabase> => {
    if (dbInstance) return dbInstance;
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
    const idb = await openDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

const dbPut = async (key: string, value: any): Promise<void> => {
    const idb = await openDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => {
            console.log(`✅ DB: Datos guardados bajo la clave [${key}]`);
            resolve();
        };
        tx.onerror = () => {
            console.error(`❌ DB: Error al guardar datos:`, tx.error);
            reject(tx.error);
        };
    });
};

const getFlexProp = (obj: any, target: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedTarget = normalize(target);
    if (obj[target] !== undefined) return obj[target];
    for (const key in obj) {
        if (normalize(key) === normalizedTarget) return obj[key];
    }
    return undefined;
};

const toS = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
};

const sanitizeAppData = (data: any): AppData => {
    const safeData = data || {};
    
    return {
        users: Array.isArray(getFlexProp(safeData, 'users')) ? getFlexProp(safeData, 'users').map((u: any) => ({
            id: toS(getFlexProp(u, 'id') || Date.now() + Math.random()),
            nombre: toS(getFlexProp(u, 'nombre')),
            clave: toS(getFlexProp(u, 'clave')),
            zona: toS(getFlexProp(u, 'zona')),
            grupo: toS(getFlexProp(u, 'grupo')),
            departamento: toS(getFlexProp(u, 'departamento')),
            rol: (getFlexProp(u, 'rol') === 'admin' || getFlexProp(u, 'rol') === 'Supervisor') ? getFlexProp(u, 'rol') : 'Normal',
            verPVP: !!getFlexProp(u, 'verPVP')
        })) : [],
        
        pos: Array.isArray(getFlexProp(safeData, 'pos')) ? getFlexProp(safeData, 'pos').map((p: any) => ({
            id: toS(getFlexProp(p, 'id') || Math.random()),
            código: toS(getFlexProp(p, 'codigo')),
            zona: toS(getFlexProp(p, 'zona')),
            grupo: toS(getFlexProp(p, 'grupo')),
            dirección: toS(getFlexProp(p, 'direccion')),
            población: toS(getFlexProp(p, 'poblacion'))
        })) : [],
        
        articulos: Array.isArray(getFlexProp(safeData, 'articulos')) ? getFlexProp(safeData, 'articulos').map((a: any) => ({
            Referencia: toS(getFlexProp(a, 'Referencia')),
            Sección: toS(getFlexProp(a, 'Seccion')),
            Descripción: toS(getFlexProp(a, 'Descripcion')),
            Familia: toS(getFlexProp(a, 'Familia')),
            'Ult.Pro': toS(getFlexProp(a, 'Ult.Pro') || getFlexProp(a, 'UltPro')),
            'Ult. Costo': toS(getFlexProp(a, 'Ult. Costo') || getFlexProp(a, 'UltCosto')),
            IVA: toS(getFlexProp(a, 'IVA'))
        })) : [],
        
        tarifas: Array.isArray(getFlexProp(safeData, 'tarifas')) ? getFlexProp(safeData, 'tarifas').map((t: any) => ({
            'Cod.': toS(getFlexProp(t, 'Cod.') || getFlexProp(t, 'Cod')),
            Tienda: toS(getFlexProp(t, 'Tienda')),
            'Cód. Art.': toS(getFlexProp(t, 'Cod. Art.') || getFlexProp(t, 'CodArt')),
            Descripción: toS(getFlexProp(t, 'Descripcion')),
            'P.V.P.': toS(getFlexProp(t, 'P.V.P.') || getFlexProp(t, 'PVP')),
            'PVP Oferta': toS(getFlexProp(t, 'PVP Oferta') || getFlexProp(t, 'PVPOferta')),
            'Fec.Ini.Ofe.': toS(getFlexProp(t, 'Fec.Ini.Ofe.') || getFlexProp(t, 'FecIniOfe')),
            'Fec.Fin.Ofe.': toS(getFlexProp(t, 'Fec.Fin.Ofe.') || getFlexProp(t, 'FecFinOfe'))
        })) : [],
        
        groups: Array.isArray(getFlexProp(safeData, 'groups')) ? getFlexProp(safeData, 'groups').map((g: any) => ({
            id: toS(getFlexProp(g, 'id')),
            nombre: toS(getFlexProp(g, 'nombre'))
        })) : [],
        
        companyName: toS(getFlexProp(safeData, 'companyName') || "Paraíso de la Carne Selección, S.L.U."),
        notificationEmail: toS(getFlexProp(safeData, 'notificationEmail') || ""),
        lastUpdated: toS(getFlexProp(safeData, 'lastUpdated') || new Date().toLocaleString()),
        reports: Array.isArray(getFlexProp(safeData, 'reports')) ? getFlexProp(safeData, 'reports') : [],
        backups: Array.isArray(getFlexProp(safeData, 'backups')) ? getFlexProp(safeData, 'backups') : []
    };
};

async function loadAndInitializeData(): Promise<AppData> {
    const cachedLocal = await dbGet(DATA_KEY);
    const localTimestamp = parseInt(localStorage.getItem(LOCAL_UPDATED_KEY) || '0');
    
    if (db) {
        try {
            const snap = await getDoc(doc(db, "appData", "main"));
            if (snap.exists()) {
                const cloudDataRaw = snap.data();
                const cloudTimestamp = cloudDataRaw.serverTimestamp ? 
                    (cloudDataRaw.serverTimestamp instanceof Timestamp ? cloudDataRaw.serverTimestamp.toMillis() : cloudDataRaw.serverTimestamp) 
                    : 0;

                // Prioridad total a la marca de tiempo más alta
                if (cloudTimestamp > localTimestamp || !cachedLocal) {
                    console.log("☁️ Nube detectada como más reciente. Sincronizando...");
                    const cloudData = sanitizeAppData(cloudDataRaw);
                    await dbPut(DATA_KEY, cloudData);
                    return cloudData;
                }
            }
        } catch (e) {
            console.warn("Cloud error, using local.");
        }
    }

    if (cachedLocal) return sanitizeAppData(cachedLocal);

    const initial = sanitizeAppData({
        users: usuariosRawData.users,
        pos: usuariosRawData.pos,
        articulos: articulosRawData,
        tarifas: tarifasRawData,
        groups: [...new Set(usuariosRawData.pos.map(p => p.grupo))].map(g => ({ id: toS(g), nombre: toS(g) }))
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
    const updated = sanitizeAppData({ 
        ...current, 
        ...updates, 
        lastUpdated: new Date().toLocaleString() 
    });
    
    localStorage.setItem(LOCAL_UPDATED_KEY, now.toString());
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);

    if (db) {
        try {
            await setDoc(doc(db, "appData", "main"), {
                ...updated,
                serverTimestamp: now
            });
        } catch (e) {
            console.error("Sync failed.");
        }
    }
}

export async function overwriteAllData(newData: AppData): Promise<void> {
    console.log("💾 Iniciando sobrescritura masiva de datos...");
    const now = Date.now();
    const updated = sanitizeAppData({ 
        ...newData, 
        lastUpdated: new Date().toLocaleString() 
    });
    
    // 1. Marcar prioridad máxima en LocalStorage ANTES de cualquier otra cosa
    localStorage.setItem(LOCAL_UPDATED_KEY, now.toString());
    
    // 2. Guardar en Base de Datos Local y esperar confirmación real
    await dbPut(DATA_KEY, updated);
    appDataPromise = Promise.resolve(updated);

    // 3. Limpiar caches de red
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
    }

    // 4. Intentar actualizar la nube
    if (db) {
        try {
            await setDoc(doc(db, "appData", "main"), {
                ...updated,
                serverTimestamp: now
            });
            console.log("☁️ Nube actualizada tras sobrescritura local.");
        } catch (e) {
            console.warn("Cloud sync failed on overwrite, but local is safe.");
        }
    }
}

export async function clearAllLocalData(): Promise<void> {
    localStorage.clear();
    const idb = await openDB();
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    appDataPromise = null;
    window.location.reload();
}