import { TextSelection } from '@huridocs/react-text-selection-handler';
import { atom } from 'jotai';

const textSelectionAtom = atom<TextSelection | undefined>();

export { textSelectionAtom };
