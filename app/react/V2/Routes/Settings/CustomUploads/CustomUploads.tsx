/* eslint-disable max-statements */
import React, { useState } from 'react';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { getByType, upload, remove } from 'V2/api/files';
import { Button, ConfirmationModal, Modal, Table } from 'V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { FileDropzone } from 'V2/Components/Forms';
import { notificationAtom } from 'V2/atoms';
import { createColumns } from './components/UploadsTable';
import { FileList } from './components/FileList';

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
  const [showModal, setShowModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();

  const notify = (responses: FileType[] | FetchResponseError[], message: React.ReactNode) => {
    const hasErrors = responses.find(response => response instanceof FetchResponseError);

    setNotifications({
      type: hasErrors ? 'error' : 'success',
      text: hasErrors ? <Translate>An error occurred</Translate> : message,
    });
  };

  const handleCancel = () => {
    setShowModal(false);
    setUploads([]);
  };

  const handleSave = async () => {
    setShowModal(false);
    setIsSaving(true);
    const responses = await Promise.all(uploads.map(async file => upload(file, 'custom')));
    notify(responses, <Translate>Uploaded custom file</Translate>);
    setIsSaving(false);
    revalidator.revalidate();
  };

  const handleDelete = async (_id: FileType['_id']) => {
    const response = await remove(_id);
    notify([response], <Translate>Deleted custom file</Translate>);
    revalidator.revalidate();
  };

  const deleteMultiple = async () => {
    const filesToDelete = selectedRows.map(row => row.original._id);
    setConfirmationModal(false);
    setSelectedRows([]);
    const responses = await Promise.all(filesToDelete.map(async fileId => remove(fileId)));
    notify(responses, <Translate>Deleted custom file</Translate>);
    revalidator.revalidate();
  };

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

        <SettingsContent.Footer className="flex gap-2 justify-end">
          {selectedRows.length > 0 && (
            <Button
              styling="solid"
              color="error"
              disabled={isSaving}
              onClick={() => setConfirmationModal(true)}
            >
              <Translate>Delete</Translate>
            </Button>
          )}
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
            <FileDropzone
              className="w-auto md:min-w-72"
              onChange={newFiles => {
                setUploads(newFiles);
              }}
            />
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

      {confirmationModal && (
        <ConfirmationModal
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Do you want to delete?</Translate>}
          body={<FileList items={selectedRows} />}
          onAcceptClick={async () => deleteMultiple()}
          onCancelClick={() => setConfirmationModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { CustomUploads, customUploadsLoader };
