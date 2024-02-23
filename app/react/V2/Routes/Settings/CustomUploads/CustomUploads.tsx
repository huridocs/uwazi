/* eslint-disable max-statements */
import React, { useState } from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { getByType, upload } from 'V2/api/files';
import { Button, Modal, Table } from 'V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { FileDropzone } from 'V2/Components/Forms';
import { createColumns } from './components/UploadsTable';

const customUploadsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<FileType[]> =>
  async () => {
    const files = await getByType('custom', headers);
    return files;
  };

const CustomUploads = () => {
  const files = useLoaderData() as FileType[];
  const [uploads, setUploads] = useState<File[]>([]);
  const [selectedRows, setSelectedRows] = useState<Row<FileType>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string>();
  const [showModal, setShowModal] = useState(false);

  const handleCancel = () => {
    setShowModal(false);
    setUploads([]);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const responses = await Promise.all(
      uploads.map(async file => {
        console.log(file.name);
        setUploadingFile(file.name);
        return upload(file, 'custom', setProgress);
      })
    );

    const hasErrors = responses.filter(response => response instanceof FetchResponseError);

    setIsSaving(false);
    setProgress(0);
  };

  const handleDelete = async () => {};

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
            disabled={isSaving}
            onClick={async () => setShowModal(true)}
          >
            <Translate>Import asset</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      {showModal && (
        <Modal size="xl">
          <Modal.Header>
            <Translate>Import asset</Translate>
            <Modal.CloseButton
              onClick={() => {
                handleCancel();
              }}
              disabled={isSaving}
            />
          </Modal.Header>
          <Modal.Body>
            {isSaving ? (
              <div className="flex flex-col gap-4 justify-center items-center p-4 w-auto bg-gray-50 rounded border border-gray-300 border-dashed md:min-w-72 md:min-h-48">
                <Translate>Uploading</Translate>
                <span>
                  {uploadingFile} - {progress} %
                </span>
              </div>
            ) : (
              <FileDropzone
                className="w-auto md:min-w-72"
                onChange={newFiles => {
                  setUploads(newFiles);
                }}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-4 justify-around w-full">
              <Button
                className="w-1/2"
                styling="outline"
                disabled={isSaving}
                onClick={() => {
                  handleCancel();
                }}
              >
                <Translate>Cancel</Translate>
              </Button>
              <Button className="w-1/2" disabled={isSaving} onClick={async () => handleSave()}>
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
