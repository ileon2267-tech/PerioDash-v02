import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  inMemoryPersistence 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  memoryLocalCache,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Inicialización controlada previniendo inicialización múltiple
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase App Check using ReCaptchaEnterpriseProvider only when valid key is provided
export let appCheck: AppCheck | null = null;

const siteKey = (firebaseConfig as any).recaptchaSiteKey || '';

/**
 * Inicialización segura y encapsulada de Firebase App Check.
 * Solo se activa si existe una clave de sitio de reCAPTCHA configurada válidamente.
 */
export function initAppCheckSafely(): AppCheck | null {
  if (appCheck) return appCheck;
  if (typeof window === 'undefined') return null;

  // Verificar que exista una clave válida configurada
  if (!siteKey || siteKey.trim() === '') {
    return null;
  }

  // Verificar que exista al menos una app de Firebase inicializada en el contexto
  if (getApps().length === 0) {
    return null;
  }

  const targetApp = app || getApp();
  if (!targetApp) {
    return null;
  }

  try {
    const isDev = (import.meta as any).env?.DEV || process.env.NODE_ENV !== 'production';

    // Usar el token de depuración solo cuando la aplicación esté en entorno de desarrollo
    if (isDev) {
      const debugToken = (import.meta as any).env?.VITE_APPCHECK_DEBUG_TOKEN;
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
    }

    if (typeof initializeAppCheck === 'function' && typeof ReCaptchaEnterpriseProvider === 'function') {
      appCheck = initializeAppCheck(targetApp, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (err) {
    console.warn('Aviso en inicialización de Firebase App Check:', err);
  }

  return appCheck;
}

// Ejecutar inicialización segura si estamos en el cliente y la app tiene clave válida
if (typeof window !== 'undefined' && siteKey && siteKey.trim() !== '') {
  initAppCheckSafely();
}

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;

// Always use memoryLocalCache to guarantee 100% immunity against "SecurityError: The operation is insecure"
// while keeping full live bidirectional synchronization with the cloud Firestore database.
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, firestoreDbId || undefined);
  } catch {
    try {
      return firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
    } catch (e) {
      console.warn("Firestore initialization fallback:", e);
      return getFirestore(app);
    }
  }
})(); /* CRITICAL: The app will break without proper firestore initialization */

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  } catch {
    return getAuth(app);
  }
})();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const value = (obj as Record<string, any>)[key];
    if (value !== undefined) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result as T;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
