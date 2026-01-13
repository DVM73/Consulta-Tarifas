
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("🚀 Motor de renderizado estable v1.3.2...");

// Registro de Service Worker para PWA (solo en producción o dominios seguros)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' && !window.location.hostname.includes('ai.studio')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('✅ Service Worker listo:', reg.scope))
      .catch(err => console.warn('⚠️ Service Worker omitido en este entorno.'));
  });
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
