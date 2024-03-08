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
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();
  const [uploads, setUploads] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string>();
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [selectedRows, setSelectedRows] = useState<Row<FileType>[]>([]);
  const [uploadQueueResponse, setUploadQueueResponse] = useState<FileType[] | FetchResponseError[]>(
    []
  );
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [uploadsModal, setUploadsModal] = useState(false);
  const [modalProps, setModalProps] = useState<{
    action: () => void;
    items: Row<FileType>[] | FileType[];
  }>({
    action: () => {},
    items: [],
  });

  const notify = (responses: FileType[] | FetchResponseError[], message: React.ReactNode) => {
    const hasErrors = responses.find(response => response instanceof FetchResponseError);

    setNotifications({
      type: hasErrors ? 'error' : 'success',
      text: hasErrors ? <Translate>An error occurred</Translate> : message,
    });
  };

  const handleCancel = () => {
    setUploadsModal(false);
    setUploads([]);
  };

  const uploadFile = async (file: File) => {
    setUploadingFile(file.name);
    setUploadProgress(0);
    return upload(file, 'custom', progress => {
      setUploadProgress(progress);
    });
  };

  const uploadQueue = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) {
      notify(uploadQueueResponse, <Translate>Uploaded custom file</Translate>);
      return;
    }
    const file = filesToUpload.shift();
    if (file) {
      const result = await uploadFile(file);
      setUploadQueueResponse([...uploadQueueResponse, result]);
      revalidator.revalidate();
      await uploadQueue(filesToUpload);
    }
  };

  const handleSave = async () => {
    setUploadsModal(false);
    await uploadQueue([...uploads]);
    setUploadingFile(undefined);
    setUploadProgress(0);
  };

  const handleDelete = async (file: FileType) => {
    setConfirmationModal(true);
    setModalProps({
      items: [file],
      action: async () => {
        setConfirmationModal(false);
        const response = await remove(file._id);
        notify([response], <Translate>Deleted custom file</Translate>);
        revalidator.revalidate();
      },
    });
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
            columns={createColumns(handleDelete)}
            data={files}
            title={<Translate>Custom Uploads</Translate>}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2 justify-end items-center">
          {uploadingFile && (
            <div className="flex grow">
              <Translate>Uploading</Translate>...&nbsp;
              <span className="font-semibold">{uploadingFile}</span>&nbsp;
              {uploadProgress}%&nbsp;
              <span className="flex flex-nowrap before:content-['('] after:content-[')']">
                {uploads.length - uploadQueueResponse.length}&nbsp;
                <Translate>remaining files</Translate>
              </span>
            </div>
          )}
          {selectedRows.length > 0 && (
            <Button
              styling="solid"
              color="error"
              onClick={() => {
                setConfirmationModal(true);
                setModalProps({ items: selectedRows, action: deleteMultiple });
              }}
            >
              <Translate>Delete</Translate>
            </Button>
          )}
          <Button styling="solid" color="primary" onClick={async () => setUploadsModal(true)}>
            <Translate>Import asset</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      {uploadsModal && (
        <Modal size="xl">
          <Modal.Header>
            <Translate>Import asset</Translate>
            <Modal.CloseButton
              onClick={() => {
                handleCancel();
              }}
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
            <div className="flex w-full">
              <div className="flex gap-4">
                <Button
                  className="w-1/2"
                  styling="outline"
                  onClick={() => {
                    handleCancel();
                  }}
                >
                  <Translate>Cancel</Translate>
                </Button>
                <Button className="w-1/2" onClick={async () => handleSave()}>
                  <Translate>Add</Translate>
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {confirmationModal && (
        <ConfirmationModal
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Do you want to delete the following items?</Translate>}
          body={<FileList items={modalProps.items} />}
          onAcceptClick={async () => modalProps.action()}
          onCancelClick={() => setConfirmationModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { CustomUploads, customUploadsLoader };
