import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket connection errors and Firestore WebChannel warnings in the AI Studio environment
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
    return;
  }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('WebChannelConnection')) {
    return;
  }
  if (typeof args[1] === 'string' && args[1].includes('WebChannelConnection')) {
    return;
  }
  originalConsoleWarn(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (
    reason === 'WebSocket closed without opened.' ||
    (reason && typeof reason === 'string' && reason.includes('WebSocket')) ||
    (reason && reason.message && reason.message.includes('WebSocket'))
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
