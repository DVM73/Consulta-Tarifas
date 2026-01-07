import React, { useState, useEffect } from 'react';
import { User, AppData } from '../types';
import LockIcon from './icons/LockIcon';
import UserIcon from './icons/UserIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import ChatIcon from './icons/ChatIcon';
import { APP_VERSION } from '../constants';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  appData: AppData | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, appData }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const companyName = appData?.companyName || 'Cargando...';
  const lastUpdatedText = appData?.lastUpdated || 'Sincronizando...';
  const users = appData?.users || [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Introduce tus credenciales');
      return;
    }

    const foundUser = users.find(u => 
      String(u.nombre).trim().toLowerCase() === username.trim().toLowerCase() && 
      String(u.clave) === password
    );

    if (foundUser) {
        onLogin(foundUser);
    } else {
        setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800 overflow-hidden animate-fade-in p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 text-brand-600 mb-4">
             <ChatIcon className="w-full h-full stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white text-center leading-tight mb-2">
            {companyName}
          </h1>
          <div className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[10px] font-bold mb-4 uppercase">
            v{APP_VERSION}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-tight">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="block w-full border border-gray-300 dark:border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-white"
                placeholder="usuario"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-tight">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <LockIcon className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="block w-full border border-gray-300 dark:border-slate-700 rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-white"
                placeholder="contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!appData}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 active:scale-[0.98] disabled:bg-brand-400 disabled:cursor-wait"
          >
            {!appData ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-400 text-[10px] font-medium">
            Datos actualizados: {lastUpdatedText}
          </p>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 text-gray-400 dark:text-gray-600 text-[10px] font-medium pointer-events-none">
        By Daniel Vázquez Medina
      </div>
    </div>
  );
};

export default LoginScreen;