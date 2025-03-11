import React, { useState } from 'react';
import { Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { AddExtractorProvider } from './AddExtractorContext';
import { AddExtractorModal } from './AddExtractorModal';

const AddExtractorModalComponent = ({ disabled }: { disabled: boolean }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && (
        <AddExtractorProvider setShowModal={setShowModal}>
          <AddExtractorModal />
        </AddExtractorProvider>
      )}
      <Button type="button" onClick={() => setShowModal(true)} disabled={disabled}>
        <Translate>Add extractor</Translate>
      </Button>
    </>
  );
};

export { AddExtractorModalComponent };
