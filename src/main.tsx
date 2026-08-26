import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installConsoleSecurityShield } from './utils/securityShield';

// Install PII/PHI Console Sanitizer
installConsoleSecurityShield();

// Protect against external cross-origin iframe Script Errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message === 'Script error.' ||
      !event.filename ||
      (typeof event.message === 'string' && event.message.includes('Script error'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason === 'Script error.' ||
        event.reason.message === 'Script error.' ||
        event.reason.name === 'AbortError' ||
        (typeof event.reason.message === 'string' && event.reason.message.includes('Script error')))
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

