import React, { useState } from 'react';
import { ImportConfig } from '../types';
import { Github, Key, Search, AlertCircle, ExternalLink } from 'lucide-react';

interface RepoFormProps {
  onImport: (config: ImportConfig) => void;
  isLoading: boolean;
  error?: string;
}

export const RepoForm: React.FC<RepoFormProps> = ({ onImport, isLoading, error }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onImport({ repoUrl, githubToken: token });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
          <Github className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Importar Repositorio</h2>
        <p className="text-slate-400 text-sm">
          Conecta tu repositorio <strong>Consulta-Tarifas</strong> para empezar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
            Repositorio (Usuario/Nombre)
          </label>
          <div className="relative">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Ej: DVM73/Consulta-Tarifas"
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
              required
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
          >
            <Key className="w-3 h-3" />
            {showTokenInput ? 'Ocultar configuración de Token' : 'Configurar Token (Necesario para guardar)'}
          </button>
          
          {showTokenInput && (
            <div className="relative animate-fadeIn bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <div className="mb-2 flex justify-between items-center">
                 <label className="text-[10px] uppercase text-slate-500 font-bold">GitHub Personal Access Token</label>
                 <a 
                   href="https://github.com/settings/tokens/new?scopes=repo&description=GeminiEditor" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                 >
                   Crear Token <ExternalLink className="w-2 h-2" />
                 </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-white text-sm"
                />
                <Key className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-amber-500/80 mt-2 leading-tight">
                * Selecciona el permiso <strong>"repo"</strong> al crear el token para poder guardar cambios.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !repoUrl}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${isLoading || !repoUrl 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98]'}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <span>Cargar Proyecto</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
