/**
 * PerioDash v15 Pro - Safe Clipboard Utility
 * Prevents "SecurityError: The operation is insecure" in sandboxed/restricted iframe contexts.
 */

export async function copyToClipboardSafely(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern Async Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls through to fallback without throwing
  }

  // 2. Fallback using document.execCommand('copy')
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch {
    // Both methods failed safely
  }

  return false;
}
