/* eslint-disable func-call-spacing */
/* eslint-disable no-spaced-func */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { getByType, remove, UploadService } from 'V2/api/files';
import { Button, ConfirmationModal, Table } from 'V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ConfirmNavigationModal } from 'V2/Components/Forms';
import { notificationAtom } from 'V2/atoms';
import {
  createColumns,
  FileList,
  UploadProgress,
  DropzoneModal,
  EditFileSidepanel,
} from './components';

const customUploadsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<FileType[]> =>
  async () => {
    const files = await getByType('custom', headers);
    return files;
  };

const uploadService = new UploadService('custom');

const CustomUploads = () => {
  const files = useLoaderData() as FileType[];
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();
  const [selectedRows, setSelectedRows] = useState<Row<FileType>[]>([]);
  const [fileToEdit, setFileToEdit] = useState<FileType>();
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [confirmNavigationModal, setConfirmNavigationModal] = useState(false);
  const [showSidepanel, setShowSipanel] = useState(false);
  const [modalProps, setModalProps] = useState<{
    action: () => void;
    items: Row<FileType>[] | FileType[];
  }>({
    action: () => {},
    items: [],
  });

  const blocker = useBlocker(Boolean(uploadService.isUploading()));

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setConfirmNavigationModal(true);
    }

    if (blocker.state === 'proceeding') {
      uploadService.abort();
    }
  }, [blocker, setConfirmNavigationModal]);

  const notify = (responses: (FileType | FetchResponseError)[], message: React.ReactNode) => {
    const hasErrors = responses.find(
      response => response instanceof FetchResponseError || !response._id
    );
    const didUploadFiles = responses.find(
      response => !(response instanceof FetchResponseError) && response._id
    );

    if (didUploadFiles) {
      setNotifications({
        type: 'success',
        text: message,
      });
    }

    if (hasErrors) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
      });
    }
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
            columns={createColumns(handleDelete, file => {
              setShowSipanel(true);
              setFileToEdit(file);
            })}
            data={files}
            title={<Translate>Custom Uploads</Translate>}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2 justify-end items-center">
          <UploadProgress queueLength={uploadService.getFilesInQueue().length} />
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
          <Button styling="solid" color="primary" onClick={async () => setShowUploadsModal(true)}>
            <Translate>Import asset</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      <DropzoneModal
        isOpen={showUploadsModal}
        setIsOpen={setShowUploadsModal}
        uploadService={uploadService}
        notify={notify}
      />

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

      {confirmNavigationModal && (
        <ConfirmNavigationModal
          setShowModal={setConfirmNavigationModal}
          onConfirm={async () => {
            if (blocker.proceed) {
              blocker.proceed();
            }
          }}
        />
      )}

      <EditFileSidepanel
        showSidepanel={showSidepanel}
        closeSidepanel={() => setShowSipanel(false)}
        file={fileToEdit}
      />
    </div>
  );
};

export { CustomUploads, customUploadsLoader };
