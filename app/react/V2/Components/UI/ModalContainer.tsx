import React from 'react';
import { useRecoilValue } from 'recoil';
import { modalAtom, showModalAtom } from 'V2/atoms';
import { Modal } from 'V2/Components/UI/Modal';

const ModalContainer = () => {
  const modal = useRecoilValue(modalAtom);
  const show = useRecoilValue(showModalAtom);

  return (
    <div className="tw-content">
      <Modal size={modal.size} show={show}>
        {modal.children}
      </Modal>
    </div>
  );
};

export { ModalContainer };
