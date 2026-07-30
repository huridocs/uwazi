import { atom } from 'jotai';

/**
 * Atom to store the initial mobile state from server-side rendering
 * This is set during SSR based on User-Agent detection
 */
export const serverIsMobileAtom = atom<boolean | undefined>(undefined);

/** When set, useIsMobile returns this value and skips viewport listeners (Storybook). */
export const isMobileOverrideAtom = atom<boolean | undefined>(undefined);
