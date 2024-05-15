import { atom } from 'jotai';

const globalMatomoAtom = atom({ id: '', url: '' } as { id: string; url: string });

export { globalMatomoAtom };
