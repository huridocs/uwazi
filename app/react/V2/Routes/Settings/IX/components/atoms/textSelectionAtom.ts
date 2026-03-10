import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { atom } from 'jotai';

const textSelectionAtom = atom<TextSelection | undefined>();

export { textSelectionAtom };
