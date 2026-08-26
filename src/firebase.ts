import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check with reCAPTCHA v3 only when configured
export let appCheck: AppCheck | null = null;

const reCaptchaKey = ((import.meta as any).env?.VITE_RECAPTCHA_V3_SITE_KEY as string) || (firebaseConfig as any).recaptchaSiteKey || '';

if (typeof window !== 'undefined' && reCaptchaKey) {
  try {
    if (process.env.NODE_ENV !== 'production' || (import.meta as any).env?.DEV) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = (import.meta as any).env?.VITE_APPCHECK_DEBUG_TOKEN || true;
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(reCaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('🛡️ Firebase App Check initialized with reCAPTCHA v3 Provider.');
  } catch (err) {
    console.warn('Firebase App Check initialization notice:', err);
  }
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
