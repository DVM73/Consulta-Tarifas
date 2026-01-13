
import React, { useState, useEffect, useRef } from 'react';
import { User, PointOfSale, Group, Report, AppData, UserRole, Departamento, Backup, Articulo, Tarifa } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import UploadIcon from './icons/UploadIcon';
import ExportIcon from './icons/ExportIcon';
import MailIcon from './icons/MailIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import HistoryIcon from './icons/HistoryIcon';
import SettingsIcon from './icons/SettingsIcon';
import HelpIcon from './icons/HelpIcon';
import SparklesIcon from './icons/SparklesIcon';
import { getAppData, saveAllData, overwriteAllData } from '../services/dataService';

// --- VISTAS DE SOLO LECTURA PARA SUPERVISOR ---

export const ReadOnlyUsersList: React.FC<{ users: User[], posList: PointOfSale[] }> = ({ users, posList }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
        <div className="p-6 border-b dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Usuarios</h2>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] border-b dark:border-slate-700">
                <tr><th className="p-4">Cód. Tienda</th><th className="p-4">Zona</th><th className="p-4">Nombre</th><th className="p-4">Departamento</th><th className="p-4">Grupo</th><th className="p-4">Ver PVP</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
                {users.map(u => {
                    const uPos = posList.find(p => p.zona === u.zona);
                    return (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 font-bold">{uPos?.código || '--'}</td>
                            <td className="p-4 font-medium">{u.zona}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{u.nombre}</td>
                            <td className="p-4 text-slate-500">{u.departamento}</td>
                            <td className="p-4 text-slate-500">{u.grupo}</td>
                            <td className="p-4 font-bold">{u.verPVP ? 'Sí' : 'No'}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export const ReadOnlyPOSList: React.FC<{ pos: PointOfSale[] }> = ({ pos }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
        <div className="p-6 border-b dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Puntos de Venta</h2>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] border-b dark:border-slate-700">
                <tr><th className="p-4">Cód</th><th className="p-4">Zona</th><th className="p-4">Grupo</th><th className="p-4">Dirección</th><th className="p-4">Población</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
                {pos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold">{p.código}</td>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{p.zona}</td>
                        <td className="p-4 text-slate-500">{p.grupo}</td>
                        <td className="p-4 text-slate-500 text-xs">{p.dirección}</td>
                        <td className="p-4 text-slate-500">{p.población}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const ReadOnlyGroupsList: React.FC<{ groups: Group[] }> = ({ groups }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl mx-auto overflow-hidden animate-fade-in">
        <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 uppercase font-bold text-sm tracking-widest text-slate-700 dark:text-white">Grupos</div>
        <div className="p-4 divide-y dark:divide-slate-700">
            {groups.map(g => (
                <div key={g.id} className="py-4 flex justify-between items-center px-4 hover:bg-gray-50/50 dark:hover:bg-slate-900/30 transition-all">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">{g.nombre}</span>
                </div>
            ))}
        </div>
    </div>
);

// --- MODAL DE CONFIRMACIÓN ---
const ConfirmModal: React.FC<{ 
    isOpen: boolean, 
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel: () => void 
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all">
                <div className="p-8">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
                        <TrashIcon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 text-center">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed text-center">{message}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-6 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-6 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-all uppercase tracking-widest">No, cancelar</button>
                    <button onClick={onConfirm} className="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/20 transition-all uppercase tracking-widest">Sí, borrar</button>
                </div>
            </div>
        </div>
    );
};

interface ViewProps {
    onUpdate: (newData: Partial<AppData>) => void;
}

export const UsersList: React.FC<{ users: User[] } & ViewProps> = ({ users, onUpdate }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [posList, setPosList] = useState<PointOfSale[]>([]);
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: '', name: '' });
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({ 
        nombre: '', 
        clave: '', 
        zona: '', 
        grupo: '', 
        departamento: 'Carnicero/a' as Departamento, 
        rol: 'Normal' as UserRole, 
        verPVP: false 
    });

    useEffect(() => { 
        getAppData().then(data => {
            setPosList(data.pos || []);
        }); 
    }, []);

    const handleZonaChange = (zona: string) => {
        const foundPos = posList.find(p => p.zona === zona);
        setFormData(prev => ({
            ...prev,
            zona,
            grupo: foundPos ? foundPos.grupo : ''
        }));
    };

    const openCreate = () => {
        setEditingUser(null);
        setFormData({ 
            nombre: '', 
            clave: '', 
            zona: posList[0]?.zona || '', 
            grupo: posList[0]?.grupo || '', 
            departamento: 'Carnicero/a', 
            rol: 'Normal', 
            verPVP: false 
        });
        setIsFormOpen(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFormData({ ...u });
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!formData.nombre || !formData.clave) return;
        let updated = [...users];
        if (editingUser) updated = users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
        else updated.push({ id: Date.now().toString(), ...formData });
        onUpdate({ users: updated });
        setIsFormOpen(false);
    };

    if (isFormOpen) return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-10 animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-8 uppercase tracking-tight">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre del Usuario</label>
                    <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium" placeholder="Nombre y apellidos..." />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={formData.clave} onChange={e => setFormData({...formData, clave: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-brand-600">
                            {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zona</label>
                    <select value={formData.zona} onChange={e => handleZonaChange(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium">
                        {posList.map(p => (
                            <option key={p.id} value={p.zona}>{p.zona}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grupo</label>
                    <input type="text" value={formData.grupo} disabled className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 font-bold outline-none cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Departamento</label>
                    <select value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium">
                        <option value="Carnicero/a">Carnicero/a</option>
                        <option value="Charcutero/a">Charcutero/a</option>
                        <option value="Carnicero/a y Charcutero/a">Carnicero/a y Charcutero/a</option>
                        <option value="Supervisor">Supervisor</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rol</label>
                    <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as UserRole})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium">
                        <option value="Normal">Normal</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ver Precios (PVP)</label>
                    <select value={formData.verPVP ? "Si" : "No"} onChange={e => setFormData({...formData, verPVP: e.target.value === "Si"})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium">
                        <option value="No">No</option>
                        <option value="Si">Si</option>
                    </select>
                </div>
            </div>
            <div className="mt-12 flex justify-end gap-4">
                <button onClick={() => setIsFormOpen(false)} className="px-8 py-3 bg-gray-400 text-white font-bold rounded-lg uppercase text-xs tracking-widest hover:bg-gray-500 transition-all">Cancelar</button>
                <button onClick={handleSave} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-lg uppercase text-xs tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all">Guardar Usuario</button>
            </div>
        </div>
    );

    return (
        <>
            <ConfirmModal 
                isOpen={deleteConfig.isOpen} 
                title="¿Desea eliminar el usuario?" 
                message={`Esta acción borrará permanentemente a "${deleteConfig.name}" del sistema.`} 
                onConfirm={() => { onUpdate({ users: users.filter(u => u.id !== deleteConfig.id) }); setDeleteConfig({isOpen: false, id: '', name: ''}); }} 
                onCancel={() => setDeleteConfig({isOpen: false, id: '', name: ''})} 
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                <div className="p-6 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Administración de Usuarios</h2>
                    <button onClick={openCreate} className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Nuevo Usuario</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] border-b dark:border-slate-700">
                        <tr><th className="p-4">Cód. Tienda</th><th className="p-4">Zona</th><th className="p-4">Nombre</th><th className="p-4">Departamento</th><th className="p-4">Grupo</th><th className="p-4">Ver PVP</th><th className="p-4 text-center">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {users.map(u => {
                            const uPos = posList.find(p => p.zona === u.zona);
                            return (
                                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="p-4 font-bold">{uPos?.código || '--'}</td>
                                    <td className="p-4 font-medium">{u.zona}</td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{u.nombre}</td>
                                    <td className="p-4 text-slate-500">{u.departamento}</td>
                                    <td className="p-4 text-slate-500">{u.grupo}</td>
                                    <td className="p-4 font-bold">{u.verPVP ? 'SÍ' : 'NO'}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-4">
                                            <button onClick={() => openEdit(u)} className="text-brand-600 hover:scale-125 transition-all"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => setDeleteConfig({isOpen: true, id: u.id, name: u.nombre})} className="text-red-500 hover:scale-125 transition-all"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export const POSList: React.FC<{ pos: PointOfSale[] } & ViewProps> = ({ pos, onUpdate }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPOS, setEditingPOS] = useState<PointOfSale | null>(null);
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: '', name: '' });
    const [formData, setFormData] = useState({ código: '', zona: '', grupo: '', población: '', dirección: '' });

    const openCreate = () => {
        setEditingPOS(null);
        setFormData({ código: '', zona: '', grupo: '', población: '', dirección: '' });
        setIsFormOpen(true);
    };

    const openEdit = (p: PointOfSale) => {
        setEditingPOS(p);
        setFormData({ ...p });
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!formData.código || !formData.zona) return;
        let updated = [...pos];
        if (editingPOS) updated = pos.map(p => p.id === editingPOS.id ? { ...p, ...formData } : p);
        else updated.push({ id: Date.now().toString(), ...formData });
        onUpdate({ pos: updated });
        setIsFormOpen(false);
    };

    if (isFormOpen) return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-10 animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-8 uppercase tracking-tight">Datos del Punto de Venta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código (01-99)</label>
                    <input type="text" maxLength={2} value={formData.código} onChange={e => setFormData({...formData, código: e.target.value.replace(/\D/g,'')})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-bold" placeholder="01" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zona (3 Dígitos)</label>
                    <input type="text" maxLength={3} value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value.toUpperCase()})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-bold uppercase" placeholder="CH2" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grupo</label>
                    <input type="text" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium" placeholder="Nombre del grupo..." />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Población</label>
                    <input type="text" value={formData.población} onChange={e => setFormData({...formData, población: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium" placeholder="Ciudad..." />
                </div>
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dirección</label>
                    <input type="text" value={formData.dirección} onChange={e => setFormData({...formData, dirección: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 focus:border-brand-500 outline-none font-medium" placeholder="Calle, número..." />
                </div>
            </div>
            <div className="mt-10 flex justify-end gap-3">
                <button onClick={() => setIsFormOpen(false)} className="px-8 py-3 bg-gray-400 text-white font-bold rounded-lg uppercase text-xs tracking-widest hover:bg-gray-500 transition-all">Cancelar</button>
                <button onClick={handleSave} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-lg uppercase text-xs tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all">Guardar Tienda</button>
            </div>
        </div>
    );

    return (
        <>
            <ConfirmModal 
                isOpen={deleteConfig.isOpen} 
                title="¿Desea borrar este punto de venta?" 
                message={`Esta acción eliminará la zona "${deleteConfig.name}" definitivamente.`} 
                onConfirm={() => { onUpdate({ pos: pos.filter(p => p.id !== deleteConfig.id) }); setDeleteConfig({isOpen: false, id: '', name: ''}); }} 
                onCancel={() => setDeleteConfig({isOpen: false, id: '', name: ''})} 
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                <div className="p-6 flex justify-between items-center border-b dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Administración de Puntos de Venta</h2>
                    <button onClick={openCreate} className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Añadir Tienda</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] border-b dark:border-slate-700">
                        <tr><th className="p-4">Cód</th><th className="p-4">Zona</th><th className="p-4">Grupo</th><th className="p-4">Dirección</th><th className="p-4">Población</th><th className="p-4 text-center">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {pos.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="p-4 font-bold">{p.código}</td>
                                <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{p.zona}</td>
                                <td className="p-4 text-slate-500">{p.grupo}</td>
                                <td className="p-4 text-slate-500 text-xs">{p.dirección}</td>
                                <td className="p-4 text-slate-500">{p.población}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => openEdit(p)} className="text-brand-600 hover:scale-125 transition-all"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeleteConfig({isOpen: true, id: p.id, name: p.zona})} className="text-red-500 hover:scale-125 transition-all"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export const GroupsList: React.FC<{ groups: Group[] } & ViewProps> = ({ groups, onUpdate }) => {
    const [inputValue, setInputValue] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: '', name: '' });

    const handleAddOrUpdate = () => {
        if (!inputValue.trim()) return;
        let updated = [...groups];
        if (editingId) updated = groups.map(g => g.id === editingId ? { ...g, nombre: inputValue } : g);
        else updated.push({ id: Date.now().toString(), nombre: inputValue });
        onUpdate({ groups: updated });
        setInputValue('');
        setEditingId(null);
    };

    const startEdit = (g: Group) => {
        setEditingId(g.id);
        setInputValue(g.nombre);
    };

    return (
        <>
            <ConfirmModal 
                isOpen={deleteConfig.isOpen} 
                title="¿Desea eliminar el grupo?" 
                message={`El grupo "${deleteConfig.name}" será borrado permanentemente.`} 
                onConfirm={() => { onUpdate({ groups: groups.filter(g => g.id !== deleteConfig.id) }); setDeleteConfig({isOpen: false, id: '', name: ''}); }} 
                onCancel={() => setDeleteConfig({isOpen: false, id: '', name: ''})} 
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl mx-auto overflow-hidden animate-fade-in">
                <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 uppercase font-bold text-sm tracking-widest text-slate-700 dark:text-white text-center">Grupos</div>
                <div className="p-8">
                    <div className="flex gap-3 mb-10 bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-inner">
                        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Nombre del grupo..." className="flex-1 p-3 dark:bg-slate-800 border-none outline-none font-bold text-slate-800 dark:text-white" />
                        {!editingId ? (
                            <button onClick={handleAddOrUpdate} className="bg-brand-600 text-white p-3.5 rounded-lg shadow-lg shadow-brand-600/20 active:scale-95 transition-all"><PlusIcon className="w-6 h-6 stroke-[3]"/></button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={handleAddOrUpdate} className="bg-green-600 text-white px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/10 hover:bg-green-700 transition-all">Guardar</button>
                                <button onClick={() => {setEditingId(null); setInputValue('');}} className="bg-slate-500 text-white px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-500/10 hover:bg-slate-600 transition-all">Cancelar</button>
                            </div>
                        )}
                    </div>
                    <div className="divide-y dark:divide-slate-700 border-t dark:border-slate-700">
                        {groups.map(g => (
                            <div key={g.id} className="py-4 flex justify-between items-center px-4 hover:bg-gray-50/50 dark:hover:bg-slate-900/30 rounded-xl transition-all">
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">{g.nombre}</span>
                                <div className="flex gap-6">
                                    <button onClick={() => startEdit(g)} className="text-brand-600 hover:scale-125 transition-all"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setDeleteConfig({ isOpen: true, id: g.id, name: g.nombre })} className="text-red-500 hover:scale-125 transition-all"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

// --- FUNCIÓN DE PARSEO CSV ROBUSTA ---
const normalizeHeader = (h: string): string => {
    const clean = h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/\./g, '');
    
    // Mapeo inteligente de cabeceras comunes a las claves internas
    if (clean.includes('referencia') || clean === 'ref') return 'Referencia';
    if (clean.includes('seccion') || clean.includes('sección')) return 'Sección';
    if (clean.includes('descripcion') || clean.includes('descripción') || clean === 'desc') return 'Descripción';
    if (clean.includes('familia')) return 'Familia';
    if (clean.includes('ult') && (clean.includes('costo') || clean.includes('coste'))) return 'Ult. Costo';
    if (clean.includes('ult') && clean.includes('pro')) return 'Ult.Pro';
    if (clean === 'iva') return 'IVA';
    
    // Para Tarifas
    if (clean === 'cod' || clean === 'código') return 'Cod.';
    if (clean.includes('tienda') || clean.includes('centro')) return 'Tienda';
    if (clean.includes('cod') && clean.includes('art')) return 'Cód. Art.';
    if (clean === 'pvp' || clean === 'p.v.p.') return 'P.V.P.';
    if (clean.includes('oferta') && clean.includes('pvp')) return 'PVP Oferta';
    if (clean.includes('ini') && clean.includes('ofe')) return 'Fec.Ini.Ofe.';
    if (clean.includes('fin') && clean.includes('ofe')) return 'Fec.Fin.Ofe.';

    return h.trim().replace(/^"|"$/g, ''); // Si no coincide, devolvemos limpio
};

const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    
    // Detectamos si es separado por coma o punto y coma
    const separator = lines[0].includes(';') ? ';' : ',';
    // Normalizamos las cabeceras
    const rawHeaders = lines[0].split(separator);
    const headers = rawHeaders.map(normalizeHeader);
    
    console.log("Cabeceras detectadas (Original -> Normalizada):");
    rawHeaders.forEach((h, i) => console.log(`${h} -> ${headers[i]}`));

    return lines.slice(1).map(line => {
        // Separación simple (nota: esto falla con comas dentro de comillas, pero para este caso de uso suele bastar)
        // Para ser más robusto en el futuro se podría usar una librería, pero mantendremos "sin deps externas"
        const values = line.split(separator);
        const obj: any = {};
        headers.forEach((h, i) => {
            let val = values[i]?.trim() || '';
            val = val.replace(/^"|"$/g, '');
            if (h) obj[h] = val;
        });
        return obj;
    });
};

export const DataUploadView: React.FC = () => {
    const [pendingArticulos, setPendingArticulos] = useState<Articulo[] | null>(null);
    const [pendingTarifas, setPendingTarifas] = useState<Tarifa[] | null>(null);
    
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const fileArticulosRef = useRef<HTMLInputElement>(null);
    const fileTarifasRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'art' | 'tar') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = parseCSV(text);
                
                if (type === 'art') {
                    // Validación simple: ¿Tiene referencia?
                    if (parsed.length > 0 && !parsed[0].Referencia) {
                         alert("⚠️ Advertencia: No se detectó la columna 'Referencia'. Revisa las cabeceras del CSV.");
                    }
                    setPendingArticulos(parsed as Articulo[]);
                } else {
                    if (parsed.length > 0 && (!parsed[0].Tienda && !parsed[0]['Cód. Art.'])) {
                         alert("⚠️ Advertencia: No se detectaron columnas clave (Tienda, Cód. Art.). Revisa el CSV.");
                    }
                    setPendingTarifas(parsed as Tarifa[]);
                }
            } catch (error) {
                console.error("Error parsing CSV", error);
                alert("Error al leer el archivo CSV. Asegúrate de que el formato sea correcto.");
            }
        };
        // Leemos como texto (UTF-8 por defecto)
        reader.readAsText(file);
    };

    const handleUpdate = async () => {
        if (!pendingArticulos && !pendingTarifas) return;
        setUpdating(true);
        
        try {
            const updates: Partial<AppData> = {};
            if (pendingArticulos) updates.articulos = pendingArticulos;
            if (pendingTarifas) updates.tarifas = pendingTarifas;
            
            await saveAllData(updates);
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
            
            // Limpiar estados pendientes
            setPendingArticulos(null);
            setPendingTarifas(null);
            if (fileArticulosRef.current) fileArticulosRef.current.value = '';
            if (fileTarifasRef.current) fileTarifasRef.current.value = '';
            
        } catch (error) {
            console.error("Error saving data", error);
            alert("Hubo un error al guardar los datos en la base de datos.");
        } finally {
            setUpdating(false);
        }
    };

    const canUpdate = (pendingArticulos !== null || pendingTarifas !== null);

    return (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 max-w-4xl mx-auto text-center animate-fade-in">
            <div className="flex flex-col items-center mb-10">
                <UploadIcon className="w-12 h-12 text-brand-500 mb-4 stroke-[1.5]" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Carga de Datos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center min-h-[160px] ${pendingArticulos ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-slate-700'}`}>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4">Archivo de Artículos (CSV)</p>
                    <button onClick={() => fileArticulosRef.current?.click()} className="bg-brand-50 text-brand-600 px-6 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-brand-100 transition-all border border-brand-200">Seleccionar Archivo</button>
                    <input type="file" ref={fileArticulosRef} className="hidden" accept=".csv,.txt" onChange={(e) => handleFileChange(e, 'art')} />
                    <div className="mt-4 flex items-center gap-2">
                        {pendingArticulos ? (
                            <span className="text-green-600 font-bold text-xs flex items-center gap-1.5 animate-fade-in">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                {pendingArticulos.length} artículos leídos
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs font-medium">Ningún archivo cargado</span>
                        )}
                    </div>
                </div>

                <div className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center min-h-[160px] ${pendingTarifas ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-slate-700'}`}>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4">Archivo de Tarifas (CSV)</p>
                    <button onClick={() => fileTarifasRef.current?.click()} className="bg-brand-50 text-brand-600 px-6 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-brand-100 transition-all border border-brand-200">Seleccionar Archivo</button>
                    <input type="file" ref={fileTarifasRef} className="hidden" accept=".csv,.txt" onChange={(e) => handleFileChange(e, 'tar')} />
                    <div className="mt-4 flex items-center gap-2">
                        {pendingTarifas ? (
                            <span className="text-green-600 font-bold text-xs flex items-center gap-1.5 animate-fade-in">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                {pendingTarifas.length} tarifas leídos
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs font-medium">Ningún archivo cargado</span>
                        )}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleUpdate}
                disabled={!canUpdate || updating}
                className={`w-full max-sm mx-auto py-4 rounded-lg font-bold uppercase text-xs tracking-widest transition-all shadow-lg ${canUpdate ? 'bg-brand-500 text-white shadow-brand-500/20 hover:bg-brand-600 active:scale-95' : 'bg-slate-400 text-white cursor-not-allowed opacity-80'}`}
            >
                {updating ? 'Procesando y Guardando...' : 'ACTUALIZAR BASE DE DATOS'}
            </button>

            {success && (
                <div className="mt-8 bg-green-100 border border-green-200 text-green-700 px-6 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-3 animate-fade-in">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    Base de datos actualizada correctamente.
                </div>
            )}
        </div>
    );
};

export const DataExportView: React.FC = () => {
    const handleDownload = async () => {
        try {
            const data = await getAppData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const filename = `backup_tarifas_${now.toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Error al exportar los datos.");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-lg mx-auto text-center animate-fade-in">
            <div className="flex flex-col items-center">
                <UploadIcon className="w-16 h-16 text-green-500 mb-6 stroke-[1.5]" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Exportar Base de Datos</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed max-w-xs mx-auto">
                    Descarga una copia completa de la base de datos actual en formato JSON.
                </p>
                <button 
                    onClick={handleDownload}
                    className="bg-[#22c55e] hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md shadow-green-500/20 active:scale-95"
                >
                    Descargar Copia
                </button>
            </div>
        </div>
    );
};

export const ReportsInboxView: React.FC<{ reports: Report[], onUpdate: (u: Partial<AppData>) => void, onRefresh: () => void }> = ({ reports, onUpdate, onRefresh }) => {
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, id: '' });

    const handleDownload = (report: Report) => {
        const blob = new Blob([report.csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${report.supervisorName}_${report.date.replace(/[/:\s]/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (!report.read) {
            const updatedReports = reports.map(r => r.id === report.id ? { ...r, read: true } : r);
            onUpdate({ reports: updatedReports });
        }
    };

    return (
        <>
            <ConfirmModal 
                isOpen={deleteConfig.isOpen} 
                title="¿Desea borrar este reporte?" 
                message="Esta acción eliminará permanentemente el reporte del buzón." 
                onConfirm={() => { onUpdate({ reports: reports.filter(r => r.id !== deleteConfig.id) }); setDeleteConfig({isOpen: false, id: ''}); }} 
                onCancel={() => setDeleteConfig({ isOpen: false, id: '' })} 
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden max-w-5xl mx-auto animate-fade-in">
                <div className="p-6 flex justify-between items-center border-b dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <MailIcon className="w-6 h-6 text-brand-600" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Buzón de Reportes</h2>
                    </div>
                    <button onClick={onRefresh} className="bg-brand-50 hover:bg-brand-100 text-brand-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border border-brand-200 transition-all">Actualizar</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Supervisor</th>
                                <th className="p-4">Zona</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {reports.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No hay reportes nuevos</td></tr>
                            ) : (
                                reports.map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="p-4">
                                            {report.read ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-bold uppercase">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                    DESCARGADO
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-slate-400 border border-gray-200 rounded-full text-[10px] font-bold uppercase">
                                                    <div className="w-2 h-2 rounded-full border border-dashed border-current"></div>
                                                    PENDIENTE
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-300">{report.date}</td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{report.supervisorName}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{report.zoneFilter}</td>
                                        <td className="p-4">
                                            {report.type === 'Solo Notas' ? (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Solo Notas</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Completo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-6">
                                                <button onClick={() => handleDownload(report)} className={`${report.read ? 'text-slate-300 cursor-not-allowed' : 'text-green-500 hover:scale-125'} transition-all`}><UploadIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setDeleteConfig({isOpen: true, id: report.id})} className="text-red-400 hover:scale-125 transition-all"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export const BackupView: React.FC<{ backups: Backup[], currentData: AppData, onUpdate: (u: Partial<AppData>) => void }> = ({ backups, currentData, onUpdate }) => {
    const [backupName, setBackupName] = useState('');
    const [restoring, setRestoring] = useState(false);

    const handleCreateBackup = async () => {
        if (!backupName.trim()) return;
        const newBackup: Backup = {
            id: Date.now().toString(),
            nombre: backupName,
            data: { ...currentData, backups: [] },
            fecha: new Date().toLocaleString()
        };
        const updatedBackups = [newBackup, ...backups];
        onUpdate({ backups: updatedBackups });
        setBackupName('');
    };

    const handleRestoreBackup = async (backup: Backup) => {
        if (!window.confirm(`¿Estás seguro de que quieres restaurar el punto "${backup.nombre}"? Esto sobrescribirá todos los datos actuales.`)) return;
        setRestoring(true);
        try {
            const restoredData = { ...backup.data, backups: backups };
            await overwriteAllData(restoredData);
            window.location.reload(); 
        } catch (e) {
            alert("Error en restauración.");
            setRestoring(false);
        }
    };

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm('⚠️ ATENCIÓN: Se borrarán los datos actuales para cargar los del archivo. ¿Deseas proceder?')) {
            e.target.value = ''; // Resetear el input si cancela
            return;
        }
        setRestoring(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                await overwriteAllData(json as AppData);
                window.location.reload();
            } catch (err) { 
                alert('Archivo inválido o corrupto.'); 
                setRestoring(false); 
                e.target.value = ''; // Resetear
            }
        };
        reader.readAsText(file);
    };

    if (restoring) return (
        <div className="h-40 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-brand-600 animate-pulse uppercase tracking-widest">Restaurando Sistema...</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl mx-auto animate-fade-in overflow-hidden">
            <div className="p-10 text-center flex flex-col items-center">
                <div className="text-[#2563eb] mb-4">
                    <HistoryIcon className="w-16 h-16 stroke-[1.5]" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-8 uppercase tracking-widest">Puntos de Restauración</h2>
                <div className="w-full flex gap-2 mb-10">
                    <input type="text" value={backupName} onChange={e => setBackupName(e.target.value)} placeholder="Nombre del backup" className="flex-1 p-3 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-500 dark:bg-slate-900 font-medium" />
                    <button onClick={handleCreateBackup} className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md active:scale-95 uppercase tracking-tight">Crear</button>
                </div>
                <div className="w-full space-y-4">
                    {backups.length > 0 ? (
                        backups.map(backup => (
                            <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-700 group hover:shadow-md transition-all">
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{backup.nombre}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRestoreBackup(backup)} className="bg-[#eab308] hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95">Restaurar</button>
                                    <button onClick={() => onUpdate({ backups: backups.filter(b => b.id !== backup.id) })} className="bg-[#ef4444] hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95">Borrar</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-sm italic font-medium py-4">No hay puntos de restauración guardados.</p>
                    )}
                </div>
                <div className="mt-12 pt-8 border-t dark:border-slate-700 w-full">
                    {/* BOTÓN REPARADO: Usando label para disparar el input file nativo de forma fiable */}
                    <label 
                        htmlFor="restore-file-input" 
                        className="cursor-pointer text-brand-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:bg-brand-50 px-6 py-3 rounded-lg transition-all border border-transparent hover:border-brand-200"
                    >
                        <UploadIcon className="w-5 h-5" /> Cargar archivo de copia externa
                    </label>
                    <input 
                        id="restore-file-input" 
                        type="file" 
                        className="hidden" 
                        accept=".json" 
                        onClick={(e) => (e.currentTarget.value = '')} 
                        onChange={handleImportBackup} 
                    />
                </div>
            </div>
        </div>
    );
};

export const SettingsView: React.FC<{companyName?: string, notificationEmail?: string, onUpdate: (u: Partial<AppData>) => void}> = ({companyName, notificationEmail, onUpdate}) => {
    const [name, setName] = useState(companyName || '');
    const [email, setEmail] = useState(notificationEmail || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setName(companyName || '');
        setEmail(notificationEmail || '');
    }, [companyName, notificationEmail]);

    const handleShowHelp = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.alert("Este correo recibirá los avisos cuando un supervisor envíe un listado. Requiere que la extensión \"Trigger Email\" esté activa en Firebase.");
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate({ companyName: name, notificationEmail: email });
            alert("✅ Configuración guardada.");
        } catch (e) {
            alert("❌ Error al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 max-w-[500px] mx-auto rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 animate-fade-in overflow-hidden">
            <div className="p-10 flex flex-col items-center">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 mb-8">
                    <SparklesIcon className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-10 tracking-tight uppercase tracking-widest">Configuración General</h2>
                <div className="w-full space-y-8">
                    <div className="space-y-3 text-left">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Nombre de la Empresa</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3.5 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-500 dark:bg-slate-950 font-bold transition-all" />
                    </div>
                    <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center relative">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Correo para Notificaciones</label>
                            <button type="button" onClick={handleShowHelp} className="text-indigo-500 hover:text-indigo-600 p-2 -mr-2 cursor-pointer z-10" title="Ayuda">
                                <HelpIcon className="w-5 h-5 stroke-[2.5]" />
                            </button>
                        </div>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3.5 border border-orange-200 dark:border-orange-900/30 rounded-lg outline-none focus:border-brand-500 dark:bg-slate-950 font-bold transition-all" placeholder="ejemplo@correo.com" />
                        <p className="text-[11px] font-bold text-orange-600 flex items-center gap-2 italic"><span className="text-base not-italic">⚠️</span> Introduce un email para recibir avisos automáticos.</p>
                    </div>
                    <div className="space-y-4 pt-4">
                        <button type="button" onClick={handleSave} disabled={isSaving} className="w-full bg-[#4f46e5] hover:bg-brand-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg disabled:opacity-70 uppercase text-xs tracking-widest">
                            <SparklesIcon className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                        <button type="button" className="w-full border border-gray-100 dark:border-slate-800 bg-gray-50/30 text-indigo-600 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-indigo-50/50 uppercase text-xs tracking-widest">
                            <MailIcon className="w-4 h-4" /> Enviar Email de Prueba
                        </button>
                    </div>
                </div>
                <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800 text-left w-full shadow-inner">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2"><HelpIcon className="w-3.5 h-3.5 stroke-[2.5]" /> NOTA TÉCNICA:</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">La aplicación utiliza la colección "mail" de Firestore. Asegúrate de que las reglas de seguridad permiten la escritura y que tienes configurado un proveedor SMTP en la extensión de Firebase.</p>
                </div>
            </div>
        </div>
    );
};