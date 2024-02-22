import React, { useState } from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { getByType } from 'V2/api/files';
import { Button, Modal, Table } from 'app/V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { createColumns } from './components/UploadsTable';

const customUploadsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<FileType[]> =>
  async () => {
    const files = await getByType('custom', headers);
    return files;
  };

const CustomUploads = () => {
  const files = useLoaderData() as FileType[];
  const [selectedRows, setSelectedRows] = useState<Row<FileType>[]>([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Custom Uploads" />

        <SettingsContent.Body>
          <Table<FileType>
            enableSelection
            onSelection={selected => {
              setSelectedRows(selected);
            }}
            columns={createColumns()}
            data={files}
            title={<Translate>Custom Uploads</Translate>}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="text-end">
          <Button
            styling="solid"
            color="primary"
            // disabled={!hasChanges}
            onClick={async () => setShowModal(true)}
          >
            <Translate>Import asset</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      {showModal && (
        <Modal size="md">
          <Modal.Header>
            <Translate>Import asset</Translate>
            <Modal.CloseButton onClick={() => setShowModal(false)} />
          </Modal.Header>
          <Modal.Body>
            <Translate>Browse files to upload</Translate>&nbsp;
            <Translate>or drop your files here.</Translate>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-4 justify-around w-full">
              <Button className="w-1/2" styling="outline" onClick={() => setShowModal(false)}>
                <Translate>Cancel</Translate>
              </Button>
              <Button className="w-1/2">
                <Translate>Add</Translate>
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export { CustomUploads, customUploadsLoader };
