import { Translate } from '#app/I18N/index.js';
import React, { useState } from 'react';
import AddThesauriValueModal from '#app/Metadata/components/AddThesauriValueModal.js';

interface AddThesauriValueButtonProps {
  values: any[];
  onModalAccept: Function;
}
const AddThesauriValueButton = ({ values, onModalAccept }: AddThesauriValueButtonProps) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <AddThesauriValueModal
        values={values}
        isOpen={openModal}
        onCancel={() => setOpenModal(false)}
        onAccept={(addedValues: any) => {
          setOpenModal(false);
          onModalAccept(addedValues);
        }}
      />
      <div className="multiselect-add-value">
        <button type="button" onClick={() => setOpenModal(true)}>
          <Translate>add value</Translate>
        </button>
      </div>
    </>
  );
};

export { AddThesauriValueButton };
