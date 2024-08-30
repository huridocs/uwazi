/* eslint-disable func-call-spacing */
/* eslint-disable no-spaced-func */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useSetAtom } from 'jotai';
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

type CustomUpload = FileType & { rowId: string };

const customUploadsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<CustomUpload[]> =>
  async () => {
    const files = (await getByType('custom', headers)).map(file => ({ ...file, rowId: file._id }));
    return files;
  };

const uploadService = new UploadService('custom');

const CustomUploads = () => {
  const files = useLoaderData() as CustomUpload[];
  const setNotifications = useSetAtom(notificationAtom);
  const revalidator = useRevalidator();
  const [selectedRows, setSelectedRows] = useState<CustomUpload[]>([]);
  const [fileToEdit, setFileToEdit] = useState<CustomUpload>();
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [confirmNavigationModal, setConfirmNavigationModal] = useState(false);
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [modalProps, setModalProps] = useState<{
    action: () => void;
    items: CustomUpload[];
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

  const handleDelete = async (file: CustomUpload) => {
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
    const filesToDelete = selectedRows.map(row => row._id);
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
          <Table
            data={files}
            columns={createColumns(handleDelete, file => {
              setShowSidepanel(true);
              setFileToEdit(file);
            })}
            onChange={({ selectedRows: selected }) => {
              setSelectedRows(files.filter(file => file.rowId in selected));
            }}
            enableSelections
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Custom Uploads
              </Translate>
            }
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
        closeSidepanel={() => setShowSidepanel(false)}
        file={fileToEdit}
      />
    </div>
  );
};

export type { CustomUpload };
export { CustomUploads, customUploadsLoader };
