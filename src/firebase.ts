import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Inicialización controlada previniendo inicialización múltiple
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase App Check using ReCaptchaEnterpriseProvider safely
export let appCheck: AppCheck | null = null;

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfFJ5ktAAAAAGNZZbNOs9gkNVdv6W3vctQ58uAw';

/**
 * Inicialización segura y encapsulada de Firebase App Check.
 * Verifica si getApps().length > 0 y si la app activa está lista antes de aplicar App Check.
 */
export function initAppCheckSafely(): AppCheck | null {
  if (appCheck) return appCheck;
  if (typeof window === 'undefined') return null;

  // Verificar que exista al menos una app de Firebase inicializada en el contexto
  if (getApps().length === 0) {
    console.warn('⚠️ [App Check]: No se puede inicializar App Check porque no hay aplicaciones de Firebase activas (getApps().length === 0).');
    return null;
  }

  const targetApp = app || getApp();
  if (!targetApp) {
    console.warn('⚠️ [App Check]: No se pudo obtener la instancia activa de Firebase App.');
    return null;
  }

  try {
    const isDev = (import.meta as any).env?.DEV || process.env.NODE_ENV !== 'production';

    // Usar el token de depuración solo cuando la aplicación esté en entorno de desarrollo
    if (isDev) {
      const debugToken = (import.meta as any).env?.VITE_APPCHECK_DEBUG_TOKEN;
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
      console.info('🛡️ Firebase App Check: Token de depuración habilitado en entorno de desarrollo.');
    }

    if (typeof initializeAppCheck === 'function' && typeof ReCaptchaEnterpriseProvider === 'function') {
      appCheck = initializeAppCheck(targetApp, {
        provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });

      if (isDev) {
        if (appCheck) {
          console.log(
            '%c🛡️ [App Check Dev]: Inicializado correctamente con ReCaptchaEnterpriseProvider.',
            'background: #0f766e; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            {
              siteKey: `${RECAPTCHA_ENTERPRISE_SITE_KEY.slice(0, 10)}...`,
              autoRefresh: true,
              debugTokenActive: !!(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN,
            }
          );
        } else {
          console.warn('⚠️ [App Check Dev]: initializeAppCheck retornó null o no se pudo instanciar.');
        }
      }
    } else {
      console.warn('⚠️ [App Check]: El SDK de App Check o el proveedor ReCaptchaEnterprise no están disponibles en este entorno.');
    }
  } catch (err) {
    const isDev = (import.meta as any).env?.DEV || process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.error('❌ [App Check Dev Error]: Falló la inicialización de Firebase App Check:', err);
    } else {
      console.warn('Aviso en inicialización de Firebase App Check:', err);
    }
  }

  return appCheck;
}

// Ejecutar inicialización segura si estamos en el cliente y la app está lista
if (typeof window !== 'undefined' && app) {
  initAppCheckSafely();
}

export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app); /* CRITICAL: The app will break without this line */

export const auth = getAuth(app);

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
