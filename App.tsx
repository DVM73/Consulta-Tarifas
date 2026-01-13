
import React, { useState, createContext, useMemo, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import { User, AppData } from './types';
import { getAppData } from './services/dataService';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: User | null;
  logout: () => void;
  appData: AppData | null;
}

export const AppContext = createContext<AppContextType>({
  theme: 'light',
  toggleTheme: () => {},
  user: null,
  logout: () => {},
  appData: null,
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const initData = async () => {
        try {
            console.log("🚀 Iniciando carga de datos...");
            const data = await getAppData();
            setAppData(data);
        } catch (error) {
            console.error("❌ Error crítico al cargar los datos de la aplicación", error);
        } finally {
            setLoading(false);
        }
    };

    initData();

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // TIMEOUT DE SEGURIDAD: 
    // Si por alguna razón (IndexDB bloqueado, Firebase colgado) la app no responde en 4 segundos,
    // forzamos la salida de la pantalla de carga para que el usuario vea el Login (aunque sea offline).
    const safetyTimer = setTimeout(() => {
        setLoading((currentLoading) => {
            if (currentLoading) {
                console.warn("⚠️ Tiempo de carga excedido. Forzando inicio de interfaz.");
                return false;
            }
            return currentLoading;
        });
    }, 4000);

    return () => clearTimeout(safetyTimer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };
  
  const handleLogout = () => {
    setUser(null);
  };

  const contextValue = useMemo(() => ({
      theme,
      toggleTheme,
      user,
      logout: handleLogout,
      appData
  }), [theme, user, appData]);
  
  const renderContent = () => {
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950">
                <div className="text-center animate-fade-in">
                    <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-brand-600 font-bold uppercase text-xs tracking-widest animate-pulse">Iniciando Sistema...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} appData={appData} />;
    }

    switch (user.rol) {
        case 'admin':
            return <AdminDashboard />;
        case 'Supervisor':
            return <SupervisorDashboard />;
        default:
            return <UserDashboard />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-screen w-screen overflow-hidden flex flex-col font-sans">
        {renderContent()}
      </div>
    </AppContext.Provider>
  );
};

export default App;
