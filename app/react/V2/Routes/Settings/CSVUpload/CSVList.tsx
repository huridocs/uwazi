import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { ImportsTable } from './Components/ImportsTable.js';
import { UploadFileModal } from './Components/UploadFileModal.js';

const CSVList = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header title="Import CSV" />
        <SettingsContent.Body className="flex flex-col overflow-y-auto">
          <ImportsTable />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <Button
            onClick={() => setModalOpen(true)}
            type="button"
            className="float-right flex flex-row gap-2 items-center"
          >
            <PlusIcon className="w-4 h-4" />
            <Translate>Import CSV</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
      <UploadFileModal isOpen={modalOpen} onClose={closeModal} />
    </div>
  );
};

export { CSVList };
