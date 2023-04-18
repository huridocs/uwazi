import { atom } from 'recoil';
import { ModalProps } from '../Components/UI/Modal';

type modalAtomType = Omit<ModalProps, 'show'>;

const modalAtom = atom({
  key: 'Modal',
  default: {} as modalAtomType,
});

const showModalAtom = atom({
  key: 'ShowModal',
  default: false,
});

export type { modalAtomType };
export { modalAtom, showModalAtom };
