import { atom } from 'jotai';

const uploadProgressAtom = atom({ filename: '', progress: undefined } as {
  filename?: string;
  progress?: number;
});

export { uploadProgressAtom };
