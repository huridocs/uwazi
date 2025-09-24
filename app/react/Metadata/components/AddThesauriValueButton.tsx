import { Translate } from '../../I18N/index.js';
import React, { useState } from 'react';
import AddThesauriValueModal from './AddThesauriValueModal';

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
        // @ts-expect-error TS(7006): Parameter 'addedValues' implicitly has an 'any' ty... Remove this comment to see the full error message
        onAccept={addedValues => {
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
