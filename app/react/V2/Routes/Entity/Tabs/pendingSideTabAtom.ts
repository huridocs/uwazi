import { atom } from 'jotai';
import type { SideTabId } from './tabIds.js';

const pendingSideTabAtom = atom<SideTabId | null>(null);

export { pendingSideTabAtom };
