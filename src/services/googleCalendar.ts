import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Appointment, Patient } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

// In-memory cache for the access token (Never store token in localStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
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
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
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
