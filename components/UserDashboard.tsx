
import React, { useContext, useState, useEffect, useMemo, memo } from 'react';
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
import CloseIcon from './icons/CloseIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import { Tarifa, Articulo, PointOfSale, Report } from '../types';
import { getAppData, saveAllData } from '../services/dataService';
import emailjs from '@emailjs/browser';

const formatCurrency = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    let num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.').replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '-';
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
};

// --- COMPONENTE OPTIMIZADO PARA INPUT DE NOTAS ---
// Aisla el estado de escritura del resto de la tabla para evitar re-renderizados masivos al teclear.
const NoteInput = memo(({ 
    initialValue, 
    onSave 
}: { 
    initialValue: string, 
    onSave: (val: string) => void 
}) => {
    const [val, setVal] = useState(initialValue);

    // Sincronizar si el valor externo cambia (ej: reset)
    useEffect(() => {
        setVal(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
        if (val !== initialValue) {
            onSave(val);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // Dispara onBlur
        }
    };

    return (
        <input 
            type="text" 
            value={val} 
            onChange={e => setVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-transparent focus:border-brand-300 focus:bg-white dark:focus:bg-slate-800 outline-none text-xs transition-all placeholder:text-slate-400"
            placeholder="Añadir nota..."
        />
    );
});

const UserDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const { user, logout } = useContext(AppContext);
    const [tarifas, setTarifas] = useState<Tarifa[]>([]);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [posList, setPosList] = useState<PointOfSale[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [seccionFilter, setSeccionFilter] = useState('Todas');
    const [zonaFilter, setZonaFilter] = useState<string>(user?.zona || 'Todas');
    const [showOffers, setShowOffers] = useState(false);
    const [showNoPrice, setShowNoPrice] = useState(false);
    
    const [isComparing, setIsComparing] = useState(false);
    const [selectedCompareZones, setSelectedCompareZones] = useState<string[]>([]);
    
    const [notes, setNotes] = useState<Record<string, string>>({});
    
    const [isBotOpen, setIsBotOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'Completo' | 'Solo Notas'>('Completo');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        getAppData().then(data => {
            setTarifas(data.tarifas || []);
            setArticulos(data.articulos || []);
            setPosList(data.pos || []);
            setLoading(false);
        }).catch(err => {
            console.error("Error al cargar los datos del panel de usuario:", err);
            setLoading(false);
        });
    }, []);

    const tariffsByArticle = useMemo(() => {
        const map = new Map<string, Tarifa[]>();
        tarifas.forEach(t => {
            const ref = String(t['Cód. Art.']).trim();
            if (!map.has(ref)) map.set(ref, []);
            map.get(ref)!.push(t);
        });
        return map;
    }, [tarifas]);

    const getTariffForZone = (ref: string, zona: string): Tarifa | undefined => {
        const articleTariffs = tariffsByArticle.get(ref);
        if (!articleTariffs) return undefined;
        
        if (zona === 'Todas') {
            return articleTariffs[0];
        }
        return articleTariffs.find(t => t.Tienda === zona);
    };

    const filteredData = useMemo(() => {
        return articulos.filter(art => {
            const matchesSearch = art.Descripción.toLowerCase().includes(searchTerm.toLowerCase()) || art.Referencia.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            let seccionStr = art.Sección === '1' ? 'Carnicería' : (art.Sección === '2' ? 'Charcutería' : art.Sección);
            const matchesSeccion = seccionFilter === 'Todas' || seccionStr === seccionFilter;
            if (!matchesSeccion) return false;
            
            const ref = String(art.Referencia).trim();
            const articleTariffs = tariffsByArticle.get(ref) || [];

            if (showOffers) {
                const hasOffer = articleTariffs.some(t => 
                    t['PVP Oferta'] && t['PVP Oferta'] !== '' && 
                    (isComparing ? selectedCompareZones.includes(t.Tienda) : (zonaFilter === 'Todas' || t.Tienda === zonaFilter))
                );
                if (!hasOffer) return false;
            }

            if (showNoPrice) {
                const hasAnyPrice = articleTariffs.some(t => t['P.V.P.'] !== '');
                if (hasAnyPrice) return false;
            }
            return true;
        });
    }, [articulos, tariffsByArticle, searchTerm, zonaFilter, showOffers, showNoPrice, seccionFilter, isComparing, selectedCompareZones]);

    // Optimización: Callback estable para guardar notas
    const handleSaveNote = (ref: string, val: string) => {
        setNotes(prev => ({ ...prev, [ref]: val }));
    };

    const toggleAllZones = () => setSelectedCompareZones(prev => prev.length === posList.length ? [] : posList.map(p => p.zona));
    const toggleZone = (zona: string) => setSelectedCompareZones(prev => prev.includes(zona) ? prev.filter(z => z !== zona) : [...prev, zona]);

    const generateCSV = () => {
        const dataToExport = exportType === 'Completo' ? filteredData : filteredData.filter(a => notes[a.Referencia]);
        
        // 1. Construir Cabeceras: Nota va AL FINAL
        const priceHeaders = isComparing 
            ? selectedCompareZones.map(z => `;${z}`).join('') 
            : ';PVP';
            
        let headers = `Referencia;Descripción;Coste${priceHeaders};Nota`;

        // 2. Construir Filas
        const rows = dataToExport.map(art => {
            let row = `${art.Referencia};${art.Descripción};${art['Ult. Costo']}`;
            
            // Añadir precios antes de la nota
            if (isComparing) {
                selectedCompareZones.forEach(z => {
                    const t = getTariffForZone(art.Referencia, z);
                    row += `;${t?.['P.V.P.'] || '-'}`;
                });
            } else {
                const t = getTariffForZone(art.Referencia, zonaFilter);
                row += `;${t?.['P.V.P.'] || '-'}`;
            }

            // Añadir nota al final
            row += `;${notes[art.Referencia] || ''}`;
            
            return row;
        });
        
        return [headers, ...rows].join("\n");
    };

    const handleDownloadCSV = () => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([generateCSV()], { type: 'text/csv;charset=utf-8;' }));
        link.download = `listado_${exportType.replace(' ', '_')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        setIsExportModalOpen(false);
    };

    const handleSendToAdmin = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        
        setIsSending(true);
        const newReport: Report = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            supervisorName: user?.nombre || 'Supervisor',
            zoneFilter: isComparing ? selectedCompareZones.join(', ') : zonaFilter,
            type: exportType,
            csvContent: generateCSV(),
            read: false
        };

        try {
            const currentData = await getAppData();
            await saveAllData({ reports: [newReport, ...(currentData.reports || [])] });

            const serviceID = 'service_egg3xws';
            const templateID = 'template_aogq9fr';
            const publicKey = 's0Y3v_8CMdSiSPqVz';

            const templateParams = {
                supervisor: newReport.supervisorName,
                zona: newReport.zoneFilter,
                tipo: newReport.type,
                fecha: newReport.date
            };

            await emailjs.send(serviceID, templateID, templateParams, publicKey);
            console.log("📧 Correo enviado correctamente via EmailJS");
            alert("✅ Listado enviado y administrador notificado por correo.");

        } catch (error) {
            console.error("❌ Error en el proceso de envío:", error);
            alert("✅ Listado guardado en la App.\n(Nota: El aviso por email ha fallado, pero el admin verá el listado en su panel).");
        } finally {
            setIsSending(false);
            setIsExportModalOpen(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#f3f4f6] dark:bg-slate-950">
            {/* Header, filters, etc. */}
            <header className="bg-white dark:bg-slate-900 p-4 border-b dark:border-slate-800 flex items-center gap-4 shadow-sm z-10">
                 {onBack && <button onClick={onBack}><ArrowLeftIcon className="w-5 h-5" /></button>}
                <div className="relative flex-grow"><input type="text" placeholder="Buscar por descripción o referencia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-brand-500" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
                <select value={seccionFilter} onChange={e => setSeccionFilter(e.target.value)} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"><option>Todas</option><option>Carnicería</option><option>Charcutería</option></select>
                <select value={zonaFilter} disabled={isComparing} onChange={e => setZonaFilter(e.target.value)} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"><option>Todas</option>{posList.map(p=><option key={p.id}>{p.zona}</option>)}</select>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showOffers} onChange={e => setShowOffers(e.target.checked)} className="rounded text-brand-600"/> Ofertas</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showNoPrice} onChange={e => setShowNoPrice(e.target.checked)} className="rounded text-brand-600"/> Sin Precio</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} className="rounded text-brand-600"/> Comparar</label>
                <div className="ml-auto flex items-center gap-4">
                    <button onClick={() => setIsBotOpen(!isBotOpen)} className="text-slate-500 hover:text-brand-600 transition-colors"><SparklesIcon/></button>
                    <button onClick={()=>setIsExportModalOpen(true)} className="text-slate-500 hover:text-brand-600 transition-colors"><UploadIcon/></button>
                    <ThemeToggle/>
                    <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors"><LogoutIcon/></button>
                </div>
            </header>

            {isComparing && <div className="bg-white dark:bg-slate-800 p-2 flex flex-wrap gap-2 border-b dark:border-slate-700 shadow-sm z-10"><label className="flex items-center gap-2 text-sm px-2"><input type="checkbox" onChange={toggleAllZones} className="rounded text-brand-600"/> Todas las Zonas</label>{posList.map(p=><label key={p.id} className="flex items-center gap-2 text-sm px-2"><input type="checkbox" checked={selectedCompareZones.includes(p.zona)} onChange={()=>toggleZone(p.zona)} className="rounded text-brand-600"/>{p.zona}</label>)}</div>}

            <main className="flex-1 overflow-auto p-4 custom-scrollbar">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-[#f3f4f6] dark:bg-slate-950 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Cód.</th>
                            <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Descripción</th>
                            {user?.rol !== 'Normal' && <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Coste</th>}
                            {!isComparing ? <>
                                <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">PVP</th>
                                <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Oferta</th>
                                <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Inicio</th>
                                <th className="p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Fin</th>
                            </> : selectedCompareZones.map(z=><th key={z} className="p-3 font-bold text-slate-500 uppercase text-[10px] text-center tracking-wider">{z}</th>)}
                            <th className="p-3 font-bold text-slate-500 uppercase text-[10px] w-1/4 tracking-wider">Nota de Supervisor</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y dark:divide-slate-800">
                        {filteredData.map(art => {
                            const t = getTariffForZone(art.Referencia, zonaFilter);
                            const hasOffer = t && t['PVP Oferta'] && t['PVP Oferta'] !== '';
                            
                            return (
                                <tr key={art.Referencia} className={`transition-colors border-b dark:border-slate-800 ${hasOffer ? 'bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                                    <td className="p-3 font-mono text-xs text-slate-500">{art.Referencia.replace(/\D/g,'')}</td>
                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{art.Descripción}</td>
                                    {user?.rol !== 'Normal' && <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{formatCurrency(art['Ult. Costo'])}</td>}
                                    
                                    {!isComparing ? <>
                                        <td className="p-3">
                                            {hasOffer ? (
                                                <span className="line-through text-red-500 font-bold decoration-2 opacity-70 text-xs">
                                                    {formatCurrency(t?.['P.V.P.'])}
                                                </span>
                                            ) : (
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(t?.['P.V.P.'])}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {hasOffer ? (
                                                <span className="font-extrabold text-green-700 dark:text-green-400 text-base bg-green-200/50 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-800">
                                                    {formatCurrency(t!['PVP Oferta'])}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs font-medium text-slate-600">{t?.['Fec.Ini.Ofe.']||'-'}</td>
                                        <td className="p-3 text-xs font-medium text-slate-600">{t?.['Fec.Fin.Ofe.']||'-'}</td>
                                    </> : selectedCompareZones.map(z => {
                                        const tz = getTariffForZone(art.Referencia, z);
                                        const isOffer = tz && tz['PVP Oferta'] && tz['PVP Oferta'] !== '';
                                        return (
                                            <td key={z} className={`p-3 text-center border-l dark:border-slate-800 ${isOffer ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                                                <div className="flex flex-col items-center">
                                                    {isOffer && <span className="text-[10px] text-red-500 line-through mb-0.5">{formatCurrency(tz?.['P.V.P.'])}</span>}
                                                    <span className={`font-bold ${isOffer ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {formatCurrency(isOffer ? tz!['PVP Oferta'] : tz?.['P.V.P.'])}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2">
                                        <NoteInput 
                                            initialValue={notes[art.Referencia] || ''} 
                                            onSave={(val) => handleSaveNote(art.Referencia, val)} 
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </main>

            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <ExportIcon className="w-6 h-6 text-brand-600"/>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Exportar Listado</h2>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <CloseIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">Selecciona el tipo de exportación:</h3>
                                <div className="space-y-3">
                                    <label onClick={() => setExportType('Completo')} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${exportType === 'Completo' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-brand-300'}`}>
                                        <input type="radio" name="export-type" checked={exportType === 'Completo'} readOnly className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <div className="ml-4">
                                            <span className="font-bold text-slate-800 dark:text-slate-100">Listado Completo</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Exporta todos los artículos que coinciden con los filtros actuales.</p>
                                        </div>
                                    </label>
                                     <label onClick={() => setExportType('Solo Notas')} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${exportType === 'Solo Notas' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-brand-300'}`}>
                                        <input type="radio" name="export-type" checked={exportType === 'Solo Notas'} readOnly className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <div className="ml-4">
                                            <span className="font-bold text-slate-800 dark:text-slate-100">Solo Artículos con Notas</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Exporta únicamente los artículos donde hayas añadido una nota.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 flex justify-end gap-3">
                            <button onClick={() => setIsExportModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-all uppercase tracking-widest">
                                Cancelar
                            </button>
                            <button onClick={handleDownloadCSV} className="px-5 py-2.5 text-xs font-bold text-brand-700 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900 rounded-lg transition-all uppercase tracking-widest flex items-center gap-2">
                                <ArrowDownIcon className="w-4 h-4" />
                                Descargar
                            </button>
                            <button 
                                onClick={handleSendToAdmin} 
                                disabled={isSending}
                                type="button"
                                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-lg shadow-brand-600/20 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MailIcon className="w-4 h-4"/>
                                {isSending ? 'Enviando...' : 'Enviar a Admin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {isBotOpen && <div className="fixed bottom-20 right-5 w-96 h-[500px] shadow-lg rounded-lg z-50 bg-white dark:bg-slate-800 border dark:border-slate-700 overflow-hidden"><Chatbot contextData={JSON.stringify(filteredData.slice(0,10))}/></div>}
        </div>
    );
};

export default UserDashboard;
