import { atom } from 'jotai';

type FocusMetadataField = {
  fieldKey: string;
};

const focusMetadataFieldAtom = atom<FocusMetadataField | null>(null);

const esFieldToFocusKey = (field: string): string => {
  if (field === 'title') return 'title';
  if (field.startsWith('metadata.')) return field.slice('metadata.'.length);
  return field;
};

export { focusMetadataFieldAtom, esFieldToFocusKey };
export type { FocusMetadataField };
