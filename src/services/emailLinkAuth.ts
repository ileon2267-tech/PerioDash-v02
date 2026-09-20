import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from "firebase/auth";
import { auth } from "../firebase";
import { safeStorage } from "../utils/safeStorage";

const EMAIL_LINK_KEY = "perio_email_for_signin";

/**
 * Sends a passwordless sign-in email link via Firebase Auth
 */
export async function sendClinicalEmailLink(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Dirección de correo electrónico inválida." };
  }

  // Preserve the current URL location for callback handling
  const originUrl = window.location.origin;
  const actionCodeSettings = {
    url: `${originUrl}/?emailLinkAuth=true`,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
    // Save email locally to complete sign-in without asking again on return
    safeStorage.setItem(EMAIL_LINK_KEY, cleanEmail);
    return { success: true };
  } catch (err: any) {
    console.error("Error al despachar enlace de correo Firebase:", err);
    let message = "No se pudo enviar el enlace a tu correo. ";
    if (err.code === "auth/operation-not-allowed") {
      message = "El proveedor de inicio de sesión por enlace de correo (Email Link / Passwordless) aún no está activo en Firebase Authentication. Asegúrate de guardar los cambios en la Consola.";
    } else if (err.code === "auth/unauthorized-domain") {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      message = `El dominio "${currentHost}" no está en la lista de dominios autorizados en Firebase Authentication > Ajustes > Dominios autorizados.`;
    } else if (err.code === "auth/invalid-email") {
      message += "El correo ingresado no es válido.";
    } else if (err.code === "auth/quota-exceeded") {
      message += "Se ha excedido la cuota diaria de correos del proyecto Firebase.";
    } else {
      message += `${err.message || 'Error desconocido'} (${err.code || 'sin código'})`;
    }
    return { success: false, error: message };
  }
}

/**
 * Checks if current window location contains a valid Firebase Sign-in Email Link
 */
export function checkIsEmailLinkSignIn(): boolean {
  if (typeof window === "undefined") return false;
  return isSignInWithEmailLink(auth, window.location.href);
}

/**
 * Completes sign-in using the email link received in email
 */
export async function completeEmailLinkSignIn(): Promise<{ 
  success: boolean; 
  email?: string; 
  uid?: string; 
  error?: string 
}> {
  if (!checkIsEmailLinkSignIn()) {
    return { success: false, error: "El enlace no corresponde a un acceso de autenticación válido." };
  }

  let email = safeStorage.getItem(EMAIL_LINK_KEY);
  if (!email) {
    email = window.prompt("Confirme su correo electrónico institucional para completar el acceso:") || "";
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Se requiere confirmar el correo electrónico para validar el enlace." };
  }

  try {
    const credential = await signInWithEmailLink(auth, cleanEmail, window.location.href);
    safeStorage.removeItem(EMAIL_LINK_KEY);

    // Clean URL parameter without reloading page
    try {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch {}

    return {
      success: true,
      email: credential.user.email || cleanEmail,
      uid: credential.user.uid
    };
  } catch (err: any) {
    console.error("Error al verificar enlace de correo:", err);
    let message = "El enlace de acceso ha expirado o ya fue utilizado.";
    if (err.code === "auth/invalid-action-code") {
      message = "El enlace de verificación no es válido o ya fue utilizado.";
    }
    return { success: false, error: message };
  }
}
