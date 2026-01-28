
import { createContext } from 'react';
import { User, AppData } from '../types';

export interface AppContextType {
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
