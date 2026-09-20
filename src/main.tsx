import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initClientDefenseShield } from './utils/securityShield';

// Install PII/PHI Console Sanitizer & Client Anti-Tamper Shield
initClientDefenseShield();

// Protect against external cross-origin iframe Script Errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const errName = event.error?.name || '';
    if (
      msg === 'Script error.' ||
      !event.filename ||
      msg.includes('Script error') ||
      msg.includes('The operation is insecure') ||
      msg.includes('SecurityError') ||
      msg.includes('operation is insecure') ||
      errName === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason ? (reason.message || String(reason)) : '';
    const errName = reason?.name || '';
    if (
      errName === 'SecurityError' ||
      errName === 'AbortError' ||
      msg === 'Script error.' ||
      msg.includes('Script error') ||
      msg.includes('The operation is insecure') ||
      msg.includes('SecurityError') ||
      msg.includes('operation is insecure')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

