/** A path the login screen may send the reader back to. External targets,
 *  the site root and the account screens themselves are refused. */

const MAX_LENGTH = 2048;
const RETURN_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'uwazi:authReturn';
const AUTH_SEGMENTS = new Set(['login', 'setpassword', 'unlockaccount']);

type ReturnStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type StoredReturn = { path: string; at: number };

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const hasControlCharacter = (value: string): boolean =>
  Array.from(value).some(char => char.charCodeAt(0) <= 31);

const decodeReturn = (trimmed: string): string => {
  let decoded = trimmed;
  for (let pass = 0; pass < 2; pass += 1) {
    const next = safeDecode(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};

const isUnsafePath = (decoded: string): boolean =>
  !decoded.startsWith('/') ||
  decoded.startsWith('//') ||
  decoded.includes('\\') ||
  decoded.includes('://') ||
  hasControlCharacter(decoded);

const isAuthPathname = (pathname: string): boolean =>
  pathname
    .split('/')
    .filter(Boolean)
    .some(segment => AUTH_SEGMENTS.has(segment));

const boundedPath = (decoded: string): string | null => {
  const hashAt = decoded.indexOf('#');
  const beforeHash = hashAt === -1 ? decoded : decoded.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : decoded.slice(hashAt);
  const pathname = beforeHash.split('?')[0] || '/';
  if (pathname === '/' || isAuthPathname(pathname)) return null;
  return `${beforeHash}${hash}`;
};

const safeReturnPath = (input: string | null | undefined): string | null => {
  if (input == null) return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_LENGTH) return null;
  const decoded = decodeReturn(trimmed);
  if (isUnsafePath(decoded)) return null;
  return boundedPath(decoded);
};

const loginUrl = (returnPath: string | null | undefined): string => {
  const safe = safeReturnPath(returnPath);
  if (!safe) return '/login';
  return `/login?redirect=${encodeURIComponent(safe)}`;
};

const isLoginV2Enabled = (features?: { devflagloginv2?: boolean } | null): boolean =>
  Boolean(features?.devflagloginv2);

const loginRedirect = (
  returnPath: string,
  features?: { devflagloginv2?: boolean } | null
): string => (isLoginV2Enabled(features) ? loginUrl(returnPath) : '/login');

const isAuthPath = (pathname: string): boolean =>
  isAuthPathname(pathname.split('?')[0].split('#')[0]);

const browserStorages = (): ReturnStorage[] => {
  const found: ReturnStorage[] = [];
  if (typeof sessionStorage !== 'undefined') found.push(sessionStorage);
  if (typeof localStorage !== 'undefined') found.push(localStorage);
  return found;
};

const readStored = (storage: ReturnStorage): string | null => {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReturn;
    if (!parsed || typeof parsed.path !== 'string' || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > RETURN_TTL_MS) return null;
    return safeReturnPath(parsed.path);
  } catch {
    return null;
  }
};

const rememberReturnPath = (
  path: string | null | undefined,
  storages: ReturnStorage[] = browserStorages()
): void => {
  const safe = safeReturnPath(path);
  if (!safe) return;
  const payload = JSON.stringify({ path: safe, at: Date.now() });
  storages.forEach(storage => {
    try {
      storage.setItem(STORAGE_KEY, payload);
    } catch {
      // Storage blocked.
    }
  });
};

const readReturnPath = (storages: ReturnStorage[] = browserStorages()): string | null => {
  let found: string | null = null;
  storages.some(storage => {
    found = readStored(storage);
    return found !== null;
  });
  return found;
};

const consumeReturnPath = (storages: ReturnStorage[] = browserStorages()): string | null => {
  const value = readReturnPath(storages);
  storages.forEach(storage => {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked.
    }
  });
  return value;
};

export {
  STORAGE_KEY,
  consumeReturnPath,
  isAuthPath,
  isLoginV2Enabled,
  loginRedirect,
  loginUrl,
  rememberReturnPath,
  readReturnPath,
  safeReturnPath,
};
export type { ReturnStorage };
