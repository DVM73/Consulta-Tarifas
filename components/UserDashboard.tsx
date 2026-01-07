
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import Chatbot from './Chatbot';
import ThemeToggle from './ThemeToggle';
import SearchIcon from './icons/SearchIcon';
import SparklesIcon from './icons/SparklesIcon';
import LogoutIcon from './icons/LogoutIcon';
import ExportIcon from './icons/ExportIcon';
import ChatIcon from './icons/ChatIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UploadIcon from './icons/UploadIcon';
import MailIcon from './icons/MailIcon';
import { Tarifa, Articulo, PointOfSale, Report } from '../types';
import { getAppData, saveAllData } from '../services/dataService';

const formatCurrency = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    let num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.').replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '-';
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
};

const UserDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const { user, logout } = useContext(AppContext);
    const [tarifas, setTarifas] = useState<Tarifa[]>([]);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [posList, setPosList] = useState<PointOfSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    
    // Estados de Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [seccionFilter, setSeccionFilter] = useState('Todas');
    const [zonaFilter, setZonaFilter] = useState<string>(user?.zona || 'Todas');
    const [showOffers, setShowOffers] = useState(false);
    const [showNoPrice, setShowNoPrice] = useState(false);
    
    // Estados de Comparativa
    const [isComparing, setIsComparing] = useState(false);
    const [selectedCompareZones, setSelectedCompareZones] = useState<string[]>([]);
    
    // Estado de Notas (Volátil)
    const [notes, setNotes] = useState<Record<string, string>>({});
    
    // UI Modals
    const [isBotOpen, setIsBotOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'Completo' | 'Solo Notas'>('Completo');

    useEffect(() => {
        getAppData().then(data => {
            setTarifas(data.tarifas || []);
            setArticulos(data.articulos || []);
            setPosList(data.pos || []);
            setLastUpdated(data.lastUpdated || '');
            setLoading(false);
        });
    }, []);

    // Lógica de filtrado
    const filteredData = useMemo(() => {
        return articulos.filter(art => {
            // 1. Buscador
            const matchesSearch = art.Descripción.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                art.Referencia.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // 2. Sección
            let seccionStr = art.Sección;
            if (seccionStr === '1') seccionStr = 'Carnicería';
            if (seccionStr === '2') seccionStr = 'Charcutería';
            const matchesSeccion = seccionFilter === 'Todas' || seccionStr === seccionFilter;
            if (!matchesSeccion) return false;
            
            // 3. Ofertas
            if (showOffers) {
                const hasOffer = tarifas.some(t => 
                    String(t['Cód. Art.']).trim() === art.Referencia && 
                    t['PVP Oferta'] && t['PVP Oferta'] !== '' &&
                    (isComparing ? selectedCompareZones.includes(t.Tienda) : (zonaFilter === 'Todas' || t.Tienda === zonaFilter))
                );
                if (!hasOffer) return false;
            }

            // 4. Sin Precio
            if (showNoPrice) {
                const hasAnyPrice = tarifas.some(t => String(t['Cód. Art.']).trim() === art.Referencia && t['P.V.P.'] !== '');
                if (hasAnyPrice) return false;
            }

            return true;
        });
    }, [articulos, tarifas, searchTerm, zonaFilter, showOffers, showNoPrice, seccionFilter, isComparing, selectedCompareZones]);

    const handleNoteChange = (ref: string, val: string) => {
        setNotes(prev => ({ ...prev, [ref]: val }));
    };

    const toggleAllZones = () => {
        if (selectedCompareZones.length === posList.length) setSelectedCompareZones([]);
        else setSelectedCompareZones(posList.map(p => p.zona));
    };

    const toggleZone = (zona: string) => {
        setSelectedCompareZones(prev => 
            prev.includes(zona) ? prev.filter(z => z !== zona) : [...prev, zona]
        );
    };

    const generateCSV = () => {
        const dataToExport = exportType === 'Completo' 
            ? filteredData 
            : filteredData.filter(a => notes[a.Referencia]);

        let headers = "Referencia;Descripción;Coste;Nota";
        if (isComparing) {
            selectedCompareZones.forEach(z => { headers += `;${z}`; });
        } else {
            headers += ";PVP";
        }

        const rows = dataToExport.map(art => {
            let row = `${art.Referencia};${art.Descripción};${art['Ult. Costo']};${notes[art.Referencia] || ''}`;
            if (isComparing) {
                selectedCompareZones.forEach(z => {
                    const t = tarifas.find(t => String(t['Cód. Art.']).trim() === art.Referencia && t.Tienda === z);
                    row += `;${t?.['P.V.P.'] || '-'}`;
                });
            } else {
                const t = tarifas.find(t => String(t['Cód. Art.']).trim() === art.Referencia && (zonaFilter === 'Todas' || t.Tienda === zonaFilter));
                row += `;${t?.['P.V.P.'] || '-'}`;
            }
            return row;
        });

        return [headers, ...rows].join("\n");
    };

    const handleDownloadCSV = () => {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `listado_${exportType.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportModalOpen(false);
    };

    const handleSendToAdmin = async () => {
        const csv = generateCSV();
        const newReport: Report = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            supervisorName: user?.nombre || 'Supervisor',
            zoneFilter: isComparing ? selectedCompareZones.join(', ') : zonaFilter,
            type: exportType,
            csvContent: csv,
            read: false
        };

        const currentData = await getAppData();
        const updatedReports = [newReport, ...(currentData.reports || [])];
        await saveAllData({ reports: updatedReports });
        
        alert("✅ Listado enviado correctamente al administrador.");
        setIsExportModalOpen(false);
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#f3f4f6] text-brand-600 font-bold uppercase text-xs tracking-widest">
            Cargando sistema de tarifas...
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#f3f4f6] dark:bg-slate-950 overflow-hidden font-sans text-gray-800 dark:text-gray-100">
            {/* Cabecera Azul */}
            <div className="bg-brand-600 px-6 py-2.5 flex justify-center items-center shadow-sm relative z-20">
                <p className="text-white font-bold text-xs uppercase tracking-widest">
                    ZONA: <span className="text-yellow-300">{zonaFilter.toUpperCase()}</span> 
                    <span className="mx-4 text-white/30">|</span> 
                    GRUPO: <span className="text-yellow-300">{user?.grupo.toUpperCase()}</span>
                    <span className="mx-4 text-white/30">|</span> 
                    ACT: <span className="text-white/80">{lastUpdated}</span>
                </p>
            </div>

            {/* Panel de Filtros */}
            <header className="bg-white dark:bg-slate-900 p-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-4 shadow-sm z-10">
                {onBack && (
                    <button onClick={onBack} className="flex items-center gap-2 text-brand-600 font-bold text-sm hover:underline mr-2">
                        <ArrowLeftIcon className="w-4 h-4" /> Volver
                    </button>
                )}
                
                <div className="relative flex-1 max-w-[240px]">
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none text-sm focus:border-brand-500" 
                    />
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                <select 
                    value={seccionFilter} 
                    onChange={e => setSeccionFilter(e.target.value)} 
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                >
                    <option value="Todas">Todos los Artículos</option>
                    <option value="Carnicería">Carnicería</option>
                    <option value="Charcutería">Charcutería</option>
                </select>

                <select 
                    value={zonaFilter} 
                    disabled={isComparing}
                    onChange={e => setZonaFilter(e.target.value)} 
                    className={`bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium outline-none ${isComparing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <option value="Todas">Todas</option>
                    {posList.map(p => <option key={p.id} value={p.zona}>{p.zona}</option>)}
                </select>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={showOffers} onChange={e => setShowOffers(e.target.checked)} className="rounded border-gray-300 text-red-600 w-4 h-4 focus:ring-red-500" />
                        <span className="text-[11px] font-bold text-red-600 uppercase tracking-tighter group-hover:underline">Ofertas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={showNoPrice} onChange={e => setShowNoPrice(e.target.checked)} className="rounded border-gray-300 text-gray-500 w-4 h-4 focus:ring-gray-400" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter group-hover:underline">Sin Precio</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} className="rounded border-gray-300 text-brand-600 w-4 h-4 focus:ring-brand-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter group-hover:underline">Comparar</span>
                    </label>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button onClick={() => setIsBotOpen(!isBotOpen)} className="bg-brand-600 text-white p-2 rounded-lg shadow-md hover:scale-105 transition-transform">
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 text-white p-2 rounded-lg shadow-md hover:scale-105 transition-transform">
                        <UploadIcon className="w-5 h-5"/>
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
                    <span className="text-xs font-bold text-slate-500">Hola, <b className="text-slate-800 dark:text-white">{user?.nombre}</b></span>
                    <ThemeToggle />
                    <button onClick={logout} className="text-slate-400 hover:text-red-600 transition-colors"><LogoutIcon className="w-6 h-6" /></button>
                </div>
            </header>

            {/* Barra de Selección de Comparación (Imagen 2) */}
            {isComparing && (
                <div className="bg-white dark:bg-slate-900 px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 animate-fade-in items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-600 uppercase mr-4">
                        <input type="checkbox" checked={selectedCompareZones.length === posList.length} onChange={toggleAllZones} className="rounded text-brand-600" />
                        Seleccionar Todas
                    </label>
                    {posList.map(p => (
                        <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-brand-50 transition-colors">
                            <input type="checkbox" checked={selectedCompareZones.includes(p.zona)} onChange={() => toggleZone(p.zona)} className="rounded text-brand-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">({p.código}) {p.zona}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* Listado Principal */}
            <main className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-300 text-[10px] font-extrabold border-b border-gray-200 dark:border-slate-700 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-16 text-center">Cód.</th>
                                <th className="p-4 w-64">Descripción</th>
                                {user?.rol !== 'Normal' && <th className="p-4 w-24 text-center">Coste</th>}
                                
                                {!isComparing ? (
                                    <>
                                        <th className="p-4 w-24 text-center">P.V.P.</th>
                                        <th className="p-4 w-24 text-center">Oferta</th>
                                        <th className="p-4 w-20 text-center">Inicio</th>
                                        <th className="p-4 w-20 text-center">Fin</th>
                                    </>
                                ) : (
                                    selectedCompareZones.map(z => (
                                        <th key={z} className="p-4 w-24 text-center border-l border-gray-100 dark:border-slate-700 bg-brand-50/30">{z}</th>
                                    ))
                                )}
                                
                                <th className="p-4 w-40">Nota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredData.map(art => {
                                const t = tarifas.find(t => String(t['Cód. Art.']).trim() === art.Referencia && (zonaFilter === 'Todas' || t.Tienda === zonaFilter));
                                const hasOffer = t && t['PVP Oferta'] && t['PVP Oferta'] !== '';

                                return (
                                    <tr key={art.Referencia} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 text-center text-[10px] text-gray-400 font-bold">{art.Referencia.replace(/\D/g,'')}</td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200 text-xs uppercase truncate" title={art.Descripción}>{art.Descripción}</td>
                                        {user?.rol !== 'Normal' && <td className="p-4 text-center text-slate-500 font-bold text-xs">{formatCurrency(art['Ult. Costo'])}</td>}
                                        
                                        {!isComparing ? (
                                            <>
                                                <td className="p-4 text-center font-bold text-xs text-slate-700 dark:text-slate-300">{formatCurrency(t?.['P.V.P.'])}</td>
                                                <td className="p-4 text-center">
                                                    {hasOffer ? (
                                                        <span className="text-green-600 font-bold text-xs">{formatCurrency(t['PVP Oferta'])}</span>
                                                    ) : <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="p-4 text-center text-[9px] text-gray-400 font-bold">{t?.['Fec.Ini.Ofe.'] || '-'}</td>
                                                <td className="p-4 text-center text-[9px] text-gray-400 font-bold">{t?.['Fec.Fin.Ofe.'] || '-'}</td>
                                            </>
                                        ) : (
                                            selectedCompareZones.map(z => {
                                                const tz = tarifas.find(t => String(t['Cód. Art.']).trim() === art.Referencia && t.Tienda === z);
                                                const hasOfferZ = tz && tz['PVP Oferta'] && tz['PVP Oferta'] !== '';
                                                return (
                                                    <td key={z} className="p-4 text-center text-xs border-l border-gray-50 dark:border-slate-800">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={`font-bold ${hasOfferZ ? 'text-gray-400 line-through text-[10px]' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                {formatCurrency(tz?.['P.V.P.'])}
                                                            </span>
                                                            {hasOfferZ && <span className="text-green-600 font-extrabold">{formatCurrency(tz['PVP Oferta'])}</span>}
                                                        </div>
                                                    </td>
                                                );
                                            })
                                        )}
                                        
                                        <td className="p-3">
                                            <input 
                                                type="text" 
                                                value={notes[art.Referencia] || ''} 
                                                onChange={e => handleNoteChange(art.Referencia, e.target.value)}
                                                placeholder="..."
                                                className="w-full bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] px-2 py-1 outline-none focus:border-brand-500 transition-colors"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal de Exportación (Imagen 3) */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all">
                        <div className="p-10">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">Opciones de Exportación</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 text-center leading-relaxed">¿Qué desea incluir en el informe?</p>
                            
                            <div className="space-y-4 mb-10">
                                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100">
                                    <input type="radio" checked={exportType === 'Completo'} onChange={() => setExportType('Completo')} className="w-4 h-4 text-brand-600 focus:ring-brand-500" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Listado Completo</span>
                                        <span className="text-[10px] text-slate-400 font-medium">(Todo lo que se ve en pantalla)</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100">
                                    <input type="radio" checked={exportType === 'Solo Notas'} onChange={() => setExportType('Solo Notas')} className="w-4 h-4 text-brand-600 focus:ring-brand-500" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Solo Artículos con Notas</span>
                                        <span className="text-[10px] text-slate-400 font-medium">(Listado resumido con tus comentarios)</span>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={handleDownloadCSV} className="flex flex-col items-center justify-center gap-3 p-5 border border-gray-100 dark:border-slate-700 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all group">
                                    <ExportIcon className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Descargar CSV</span>
                                </button>
                                <button onClick={handleSendToAdmin} className="flex flex-col items-center justify-center gap-3 p-5 border border-gray-100 dark:border-slate-700 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                    <MailIcon className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Enviar a Admin</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 text-center">
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-[0.2em] transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chatbot IA */}
            {isBotOpen && (
                <div className="fixed bottom-24 right-8 w-[400px] h-[600px] shadow-2xl rounded-2xl overflow-hidden animate-fade-in border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
                    <div className="bg-brand-600 p-4 text-white flex justify-between items-center">
                        <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> Asistente Inteligente</span>
                        <button onClick={() => setIsBotOpen(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">✕</button>
                    </div>
                    <Chatbot contextData={JSON.stringify(filteredData.slice(0, 10))} />
                </div>
            )}

            <div className="fixed bottom-4 right-4 text-gray-300 text-[10px] font-medium pointer-events-none">
                By Daniel Vázquez Medina
            </div>
        </div>
    );
};

export default UserDashboard;