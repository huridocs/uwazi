import { atom } from 'recoil';

const uploadProgressAtom = atom({
  key: 'uploadProgress',
  default: { filename: '', progress: undefined } as { filename?: string; progress?: number },
});

export { uploadProgressAtom };
