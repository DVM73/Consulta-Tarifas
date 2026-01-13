
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import UserDashboard from './UserDashboard';
import { getAppData } from '../services/dataService';
import { AppData, PointOfSale } from '../types';
import { ReadOnlyPOSList, ReadOnlyGroupsList, ReadOnlyUsersList } from './AdminViews';

import LogoutIcon from './icons/LogoutIcon';
import ThemeToggle from './ThemeToggle';
import BuildingIcon from './icons/BuildingIcon';
import SearchIcon from './icons/SearchIcon';
import UserIcon from './icons/UserIcon';
import TagIcon from './icons/TagIcon';
import ExportIcon from './icons/ExportIcon';
import OfferIcon from './icons/OfferIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CloseIcon from './icons/CloseIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import HistoryIcon from './icons/HistoryIcon';

type SupervisorView = 'menu' | 'tarifas' | 'pos' | 'users' | 'groups' | 'inventarios' | 'tarifas_impreso';

const SupervisorDashboard: React.FC = () => {
  const { user, logout } = useContext(AppContext);
  const [view, setView] = useState<SupervisorView>('menu');
  const [stats, setStats] = useState({ totalArticles: 0, totalPos: 0, activeOffers: 0 });
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const [invMonth, setInvMonth] = useState(new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()).toUpperCase());
  const [invYear, setInvYear] = useState(new Date().getFullYear().toString());
  const [selectedPosIds, setSelectedPosIds] = useState<string[]>([]);

  const [tarPosId, setTarPosId] = useState('');
  const [tarHeaderColor, setTarHeaderColor] = useState('#1e1b4b');
  const [tarMarginColor, setTarMarginColor] = useState('#7c2d12');
  const [tarShowPvp, setTarShowPvp] = useState('Si');
  const [tarRevisionDate, setTarRevisionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
      getAppData().then(appData => {
          setData(appData);
          setStats({
              totalArticles: Number(appData.articulos?.length || 0),
              totalPos: Number(appData.pos?.length || 0),
              activeOffers: Number(appData.tarifas?.filter(t => t['PVP Oferta'] && t['PVP Oferta'] !== '').length || 0)
          });
          if (appData.pos && appData.pos.length > 0) {
              setTarPosId(appData.pos[0].id);
          }
          setLoading(false);
      });
  }, []);

  if (loading) return (
      <div className="h-screen flex items-center justify-center bg-[#f3f4f6]">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  const handleGenerateInventory = () => {
      if (selectedPosIds.length === 0) return alert("Selecciona al menos un punto de venta.");
      alert(`Generando PDF de inventarios para ${invMonth} ${invYear} de ${selectedPosIds.length} tiendas...`);
  };

  const handleGenerateTariff = () => {
      const selectedPos = data?.pos.find(p => p.id === tarPosId);
      alert(`Generando PDF de tarifas para ${selectedPos?.zona} con fecha ${tarRevisionDate}...`);
  };

  const renderViewContent = () => {
    if (!data) return null;
    switch(view) {
        case 'tarifas': return <UserDashboard onBack={() => setView('menu')} />;
        case 'pos': return <ReadOnlyPOSList pos={data.pos} />;
        case 'groups': return <ReadOnlyGroupsList groups={data.groups} />;
        case 'users': return <ReadOnlyUsersList users={data.users} posList={data.pos} />;
        
        case 'inventarios': return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-brand-600"><ArrowUpIcon className="w-6 h-6 rotate-45"/></div>
                            <h2 className="text-2xl font-bold text-slate-800">Impresos Inventarios</h2>
                        </div>
                        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Configuración de Fecha</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Mes del Inventario</label>
                                    <select value={invMonth} onChange={e => setInvMonth(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 font-bold text-sm uppercase">
                                        {['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Año</label>
                                    <input type="number" value={invYear} onChange={e => setInvYear(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 font-bold text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos de Venta</h3>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedPosIds.length === data.pos.length} onChange={e => setSelectedPosIds(e.target.checked ? data.pos.map(p => p.id) : [])} className="rounded text-brand-600" />
                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Todas</span>
                                </label>
                            </div>
                            <div className="h-[240px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {data.pos.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedPosIds.includes(p.id)} 
                                            onChange={e => setSelectedPosIds(e.target.checked ? [...selectedPosIds, p.id] : selectedPosIds.filter(id => id !== p.id))}
                                            className="rounded text-brand-600 w-4 h-4" 
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 font-bold">[{p.código}]</span>
                                            <span className="text-xs font-bold text-slate-700">{p.zona}</span>
                                            <span className="text-xs text-slate-400 font-medium ml-2">{p.población}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 border-t border-gray-100 flex flex-col items-center">
                        <button onClick={handleGenerateInventory} className="bg-[#94a3b8] hover:bg-brand-600 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-gray-200">
                            <ArrowUpIcon className="w-5 h-5 rotate-45"/> GENERAR LISTADOS PDF
                        </button>
                    </div>
                </div>
            </div>
        );

        case 'tarifas_impreso': return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-lg text-brand-600"><TagIcon className="w-6 h-6"/></div>
                            <h2 className="text-2xl font-bold text-slate-800">Impresos Tarifas</h2>
                        </div>
                        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="p-8 space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Selección de Tienda</h3>
                                <select value={tarPosId} onChange={e => setTarPosId(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 font-bold text-sm">
                                    {data.pos.map(p => (
                                        <option key={p.id} value={p.id}>{p.zona} - {p.población}</option>
                                    ))}
                                </select>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Personalización de Colores</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-gray-50 rounded-xl border flex items-center justify-between">
                                    <span className="text-xs font-bold">Texto Cabeceras</span>
                                    <input type="color" value={tarHeaderColor} onChange={e => setTarHeaderColor(e.target.value)} className="w-8 h-8 cursor-pointer"/>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border flex items-center justify-between">
                                    <span className="text-xs font-bold">Texto Info</span>
                                    <input type="color" value={tarMarginColor} onChange={e => setTarMarginColor(e.target.value)} className="w-8 h-8 cursor-pointer"/>
                                </div>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Opciones de Listado</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1"><label className="text-xs font-bold">¿Mostrar PVP?</label><select value={tarShowPvp} onChange={e => setTarShowPvp(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50"><option>Si</option><option>No</option></select></div>
                                <div className="space-y-1"><label className="text-xs font-bold">Fecha Revisión</label><input type="date" value={tarRevisionDate} onChange={e => setTarRevisionDate(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50"/></div>
                            </div>
                        </section>
                    </div>
                    <div className="p-8 border-t border-gray-100 flex justify-center">
                        <button onClick={handleGenerateTariff} className="bg-[#4f46e5] hover:bg-brand-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg">
                            GENERAR LISTADO TARIFA
                        </button>
                    </div>
                </div>
            </div>
        );

        default: return null;
    }
  };

  const menuItems = [
    { id: 'tarifas', label: 'Consultar Tarifas', icon: SearchIcon, desc: 'Listado de artículos y gestión de precios.' },
    { id: 'pos', label: 'Listar Puntos de Venta', icon: HistoryIcon, desc: 'Ver listado de tiendas y zonas.' },
    { id: 'groups', label: 'Listar Grupos', icon: BuildingIcon, desc: 'Ver listado de grupos de tiendas.' },
    { id: 'users', label: 'Listar Usuarios', icon: UserIcon, desc: 'Ver listado de usuarios del sistema.' },
    { id: 'inventarios', label: 'Impresos Inventarios', icon: ExportIcon, desc: 'Generar listados de inventario en PDF.' },
    { id: 'tarifas_impreso', label: 'Impresos Tarifas', icon: TagIcon, desc: 'Generar listados de precios en PDF.' },
  ];

  if (view !== 'menu') {
      if (view === 'tarifas') return <UserDashboard onBack={() => setView('menu')} />;
      return (
        <div className="h-screen bg-[#f3f4f6] dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
            <header className="bg-white dark:bg-slate-900 h-16 px-6 flex justify-between items-center shadow-sm border-b dark:border-slate-800 z-20">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Panel de Supervisor</h1>
                <div className="flex items-center gap-6"><ThemeToggle /><button onClick={logout} className="text-slate-400 hover:text-red-500"><LogoutIcon className="w-6 h-6" /></button></div>
            </header>
            <main className="flex-1 overflow-auto p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => setView('menu')} className="flex items-center gap-2 text-brand-600 font-bold text-xs mb-8 uppercase tracking-widest"><ArrowLeftIcon className="w-4 h-4" /> Volver al Panel</button>
                    {renderViewContent()}
                </div>
            </main>
        </div>
      );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f3f4f6] dark:bg-slate-950 font-sans overflow-hidden">
      <header className="bg-white dark:bg-slate-900 h-16 px-6 flex justify-between items-center shadow-sm border-b dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Panel de Supervisor</h1>
        <div className="flex items-center gap-6"><span className="font-bold text-sm">{user?.nombre}</span><ThemeToggle /><button onClick={logout} className="text-slate-400 hover:text-red-500"><LogoutIcon className="w-6 h-6" /></button></div>
      </header>
      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {menuItems.map(item => (
                    <button key={item.id} onClick={() => setView(item.id as SupervisorView)} className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center group hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="mb-6 text-brand-500 bg-brand-50 p-4 rounded-xl"><item.icon className="w-10 h-10" /></div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 uppercase tracking-tight">{item.label}</h3>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                    </button>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
