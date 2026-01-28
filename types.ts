
export type UserRole = 'Normal' | 'Supervisor' | 'admin';
export type Departamento = 'Carnicero/a' | 'Charcutero/a' | 'Supervisor' | 'Carnicero/a y Charcutero/a' | string;
export type Zona = string;

export interface User {
  id: string;
  nombre: string;
  clave: string;
  zona: Zona;
  grupo: string;
  departamento: Departamento;
  rol: UserRole;
  verPVP: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export type AdminView = 
  | 'menu'
  | 'users'
  | 'pos'
  | 'groups'
  | 'families'
  | 'upload'
  | 'export'
  | 'backup'
  | 'settings'
  | 'password'
  | 'reports';

export interface Articulo {
  Referencia: string;
  Sección: string;
  Descripción: string;
  Familia: string;
  'Ult.Pro': string;
  'Ult. Costo': string;
  IVA: string;
  UniMed?: string; // Nuevo campo para soportar 'P' (Peso) o 'U' (Unidad)
}

export interface PointOfSale {
  id: string;
  código: string;
  zona: Zona;
  grupo: string;
  dirección: string;
  población: string;
}

export interface Tarifa {
  'Cod.': string;
  Tienda: string;
  'Cód. Art.': string;
  Descripción: string;
  'P.V.P.': string;
  'PVP Oferta': string;
  'Fec.Ini.Ofe.': string;
  'Fec.Fin.Ofe.': string;
}

export interface Group {
    id: string;
    nombre: string;
}

export interface Family {
    id: string; // El código (ej: "05", "29")
    nombre: string; // La descripción (ej: "CERDO")
}

export interface Report {
    id: string;
    firestoreId?: string;
    date: string;
    supervisorName: string;
    zoneFilter: string;
    type: 'Completo' | 'Solo Notas';
    csvContent: string;
    isCompressed?: boolean;
    read: boolean;
}

export interface Backup {
    id: string;
    nombre: string;
    data: any;
    fecha: string;
}

export interface AppData {
    users: User[];
    pos: PointOfSale[];
    articulos: Articulo[];
    tarifas: Tarifa[];
    groups: Group[];
    families: Family[];
    companyName?: string;
    lastUpdated?: string;
    reports?: Report[];
    backups?: Backup[];
}
