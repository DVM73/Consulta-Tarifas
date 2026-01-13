
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log("🚀 Iniciando App v2.0.3...");

const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('ai.studio') && 
                     !window.location.hostname.includes('googleusercontent.com') &&
                     !window.location.hostname.includes('webcontainer.io');

// GESTIÓN DE SERVICE WORKER (CACHÉ)
if ('serviceWorker' in navigator) {
  if (isProduction) {
    // Solo registrar en producción real (dominio final)
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker registrado (Prod):', reg.scope))
        .catch(err => console.warn('⚠️ Fallo al registrar SW:', err));
    });
  } else {
    // EN PREVIEW/DEV: DESREGISTRAR ACTIVAMENTE PARA EVITAR CACHÉ OBSOLETA
    console.log("🧹 Entorno de Desarrollo/Preview detectado: Eliminando Service Workers...");
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
        console.log("🗑️ Service Worker eliminado para asegurar recarga limpia.");
      }
    });
  }
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Error: No se encontró el contenedor #root.");
}