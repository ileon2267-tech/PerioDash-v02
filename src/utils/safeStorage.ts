/**
 * PerioDash v15 Pro - Safe Storage Adapter
 * Fully guarded against "SecurityError: The operation is insecure"
 * when running inside partitioned/sandboxed browser iframes or privacy mode.
 */

const inMemoryFallback = new Map<string, string>();

function testLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    // When embedded in an iframe (e.g. preview environment), avoid touching localStorage
    // to guarantee 100% immunity against "SecurityError: The operation is insecure."
    let isEmbedded = false;
    try {
      isEmbedded = window.self !== window.top;
    } catch {
      isEmbedded = true;
    }
    if (isEmbedded) {
      return false;
    }

    const storage = window.localStorage;
    if (!storage) return false;
    const probe = '__perio_storage_probe__';
    storage.setItem(probe, 'ok');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

let hasWorkingLocalStorage = testLocalStorage();

export const safeStorage = {
  getItem(key: string): string | null {
    if (hasWorkingLocalStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        hasWorkingLocalStorage = false;
      }
    }
    return inMemoryFallback.has(key) ? inMemoryFallback.get(key)! : null;
  },

  setItem(key: string, value: string): void {
    if (hasWorkingLocalStorage) {
      try {
        window.localStorage.setItem(key, value);
        inMemoryFallback.set(key, value);
        return;
      } catch {
        hasWorkingLocalStorage = false;
      }
    }
    inMemoryFallback.set(key, value);
  },

  removeItem(key: string): void {
    if (hasWorkingLocalStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        hasWorkingLocalStorage = false;
      }
    }
    inMemoryFallback.delete(key);
  },

  clear(): void {
    if (hasWorkingLocalStorage) {
      try {
        window.localStorage.clear();
      } catch {
        hasWorkingLocalStorage = false;
      }
    }
    inMemoryFallback.clear();
  },

  getJSON<T>(key: string, defaultValue: T): T {
    try {
      const raw = this.getItem(key);
      if (raw !== null && raw !== undefined) {
        return JSON.parse(raw) as T;
      }
    } catch {}
    return defaultValue;
  },

  setJSON(key: string, value: any): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch {}
  }
};

export default safeStorage;
