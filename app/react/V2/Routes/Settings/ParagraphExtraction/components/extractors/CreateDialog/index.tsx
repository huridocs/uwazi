import React, { useState } from 'react';
import { Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { CreateExtractorProvider } from './CreateExtractorContext';
import { Dialog } from './Dialog';

const CreateDialog = ({ disabled }: { disabled: boolean }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && (
        <CreateExtractorProvider setShowModal={setShowModal}>
          <Dialog />
        </CreateExtractorProvider>
      )}
      <Button type="button" onClick={() => setShowModal(true)} disabled={disabled}>
        <Translate>Add extractor</Translate>
      </Button>
    </>
  );
};

export { CreateDialog };
