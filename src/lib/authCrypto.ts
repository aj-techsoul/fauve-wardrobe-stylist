// Encrypted localStorage session helper using Web Crypto API (AES-GCM 256-bit)
const ENCRYPTION_KEY_NAME = 'fauve_sec_k';
const AUTH_STORAGE_KEY = 'fauve_auth_session';

async function getOrCreateKey(): Promise<CryptoKey> {
  let rawKeyStr: string | null = null;
  if (typeof window !== 'undefined') {
    rawKeyStr = localStorage.getItem(ENCRYPTION_KEY_NAME);
  }

  if (!rawKeyStr) {
    const keyArray = new Uint8Array(32);
    crypto.getRandomValues(keyArray);
    rawKeyStr = Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join('');
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENCRYPTION_KEY_NAME, rawKeyStr);
    }
  }

  const keyBuffer = new Uint8Array(
    rawKeyStr.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function saveEncryptedUser(user: any): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    const key = await getOrCreateKey();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(user));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);

    // Convert to Base64 string for safe localStorage storage
    const base64Str = btoa(String.fromCharCode(...combined));
    localStorage.setItem(AUTH_STORAGE_KEY, base64Str);
  } catch (err) {
    console.error('Failed to encrypt user session:', err);
  }
}

export async function loadEncryptedUser(): Promise<any | null> {
  try {
    if (typeof window === 'undefined') return null;
    const base64Str = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!base64Str) return null;

    const key = await getOrCreateKey();
    const combined = new Uint8Array(
      atob(base64Str)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decrypt user session:', err);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return null;
  }
}

export function clearEncryptedUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
