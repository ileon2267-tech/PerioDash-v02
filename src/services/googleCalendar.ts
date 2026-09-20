import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Appointment, Patient } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory cache for the access token (Never store token in localStorage for security)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
let isSigningIn = false;

export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      cachedGoogleUser = user;
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (cachedGoogleUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(cachedGoogleUser, cachedAccessToken);
    } else if (!isSigningIn) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

const ensureGsiLoaded = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if ((window as any).google?.accounts?.oauth2) return true;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

const signInWithGis = async (): Promise<{ user: User; accessToken: string }> => {
  await ensureGsiLoaded();
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no está disponible.'));
      return;
    }
    const oAuthClientId = (firebaseConfig as any).oAuthClientId;
    if (!oAuthClientId) {
      reject(new Error('No se encontró oAuthClientId configurado.'));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: oAuthClientId,
      scope: SCOPES.join(' '),
      prompt: 'select_account',
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error || 'Error al autorizar con Google'));
          return;
        }
        const token = response.access_token;
        cachedAccessToken = token;

        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profile = await profileRes.json();
          const mockUser = {
            uid: profile.sub || 'gis-user',
            email: profile.email || 'usuario@google.com',
            displayName: profile.name || 'Usuario Google Calendar',
            photoURL: profile.picture || null,
          } as unknown as User;
          cachedGoogleUser = mockUser;
          resolve({ user: mockUser, accessToken: token });
        } catch {
          const fallbackUser = {
            uid: 'gis-user',
            email: 'Google Calendar Activo',
            displayName: 'Usuario Google',
            photoURL: null,
          } as unknown as User;
          cachedGoogleUser = fallbackUser;
          resolve({ user: fallbackUser, accessToken: token });
        }
      },
    });

    client.requestAccessToken();
  });
};

export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        cachedGoogleUser = result.user;
        return { user: result.user, accessToken: cachedAccessToken };
      }
    } catch (popupError: any) {
      console.warn('Intento con signInWithPopup avisó:', popupError?.code || popupError?.message);

      // Si falla por popup bloqueado, restricción de origen en iframe, o falta de token directo, intentar vía GIS
      if ((window as any).google?.accounts?.oauth2) {
        return await signInWithGis();
      }

      if (popupError?.code === 'auth/popup-blocked') {
        throw new Error('La ventana emergente fue bloqueada por tu navegador. Por favor permite popups para este sitio.');
      }
      if (popupError?.code === 'auth/popup-closed-by-user') {
        throw new Error('El inicio de sesión fue cancelado al cerrar la ventana emergente.');
      }
      throw popupError;
    }

    if ((window as any).google?.accounts?.oauth2) {
      return await signInWithGis();
    }

    throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
  } catch (error: any) {
    console.error('Google Calendar Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const disconnectGoogleCalendar = async () => {
  if (cachedAccessToken) {
    try {
      fetch(`https://oauth2.googleapis.com/revoke?token=${cachedAccessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(() => {});
    } catch {
      // Ignorar errores de revocación silenciosa
    }
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
}

export async function fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
  const token = getCalendarAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Calendar para obtener eventos.');
  }

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error al obtener eventos (${response.status})`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function createGoogleCalendarEvent(
  event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string; // ISO String
    endDateTime: string;   // ISO String
    attendees?: { email: string; displayName?: string }[];
  }
): Promise<GoogleCalendarEvent> {
  const token = getCalendarAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Calendar para crear eventos.');
  }

  const payload = {
    summary: event.summary,
    description: event.description,
    location: event.location || 'Clínica Dental PerioDash',
    start: {
      dateTime: event.startDateTime,
    },
    end: {
      dateTime: event.endDateTime,
    },
    attendees: event.attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error al crear evento en Google Calendar (${response.status})`);
  }

  return response.json();
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  const token = getCalendarAccessToken();
  if (!token) {
    throw new Error('Se requiere autenticación con Google Calendar para eliminar eventos.');
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error al eliminar evento en Google Calendar (${response.status})`);
  }

  return true;
}

export function convertAppointmentToCalendarDates(appointment: Appointment) {
  // Appointment date: "YYYY-MM-DD", time: "HH:MM" (duration approx 45-60 mins)
  const dateParts = appointment.date.split('-');
  const timeParts = (appointment.time || '10:00').split(':');

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  const startDate = new Date(year, month, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000); // 45 min appointment default

  return {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
  };
}
