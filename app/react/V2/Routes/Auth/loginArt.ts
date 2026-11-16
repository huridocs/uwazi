/** Login art from the design prototype. One image per page load, never the
 *  one the previous load showed. Chosen after mount so server and client
 *  render the same empty panel first. */

type LoginArt = {
  id: number;
  w1x: number;
  w2x: number;
  focus: string;
};

const LOGIN_ART: LoginArt[] = [
  { id: 1, w1x: 1200, w2x: 2048, focus: '50% 64%' },
  { id: 2, w1x: 1200, w2x: 1792, focus: '50% 55%' },
  { id: 3, w1x: 1200, w2x: 2048, focus: '62% 76%' },
  { id: 4, w1x: 1200, w2x: 1305, focus: '50% 70%' },
  { id: 5, w1x: 1200, w2x: 2048, focus: '52% 66%' },
  { id: 6, w1x: 1200, w2x: 1450, focus: '46% 88%' },
];

const LAST_KEY = 'uwazi:loginArt';

let chosen: LoginArt | null = null;

const artUrl = (id: number, width: '1x' | '2x', format: 'avif' | 'webp') =>
  `/public/login-art/art-${id}-${width}.${format}`;

const loginArtSrcSet = (art: LoginArt, format: 'avif' | 'webp'): string =>
  `${artUrl(art.id, '1x', format)} ${art.w1x}w, ${artUrl(art.id, '2x', format)} ${art.w2x}w`;

const loginArtFallback = (art: LoginArt): string => artUrl(art.id, '1x', 'webp');

const readLastId = (): number | null => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    const id = raw ? Number(raw) : null;
    return id && LOGIN_ART.some(art => art.id === id) ? id : null;
  } catch {
    return null;
  }
};

const pickLoginArt = (): LoginArt => {
  if (chosen) return chosen;
  const last = readLastId();
  const pool = LOGIN_ART.filter(art => art.id !== last);
  const next = pool[Math.floor(Math.random() * pool.length)] ?? LOGIN_ART[0];
  chosen = next;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(LAST_KEY, String(next.id));
    } catch {
      // Storage blocked: the next load may repeat this image.
    }
  }
  return next;
};

export { LOGIN_ART, loginArtFallback, loginArtSrcSet, pickLoginArt };
export type { LoginArt };
