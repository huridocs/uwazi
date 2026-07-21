/* eslint-disable func-call-spacing */
/* eslint-disable no-spaced-func */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { t, Translate } from '#app/I18N/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { FileType } from '#shared/types/fileType.js';
import { getByType, remove, UploadService } from '#V2/api/files/index.js';
import {
  Button,
  ConfirmationModal,
  Table,
  ConfirmNavigationModal,
} from '#V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  createColumns,
  FileList,
  UploadProgress,
  DropzoneModal,
  EditFileSidepanel,
} from './components/index.js';

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
  const { notify } = useRequestStatus();
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

  const handleUploadResult = (responses: (FileType | FetchResponseError)[], message: string) => {
    const hasErrors = responses.find(
      response => response instanceof FetchResponseError || !response._id
    );
    const didUploadFiles = responses.find(
      response => !(response instanceof FetchResponseError) && response._id
    );

    if (didUploadFiles) {
      notify('success', message);
    }

    if (hasErrors) {
      notify('error', t('System', 'An error occurred', null, false));
    }
  };

  const handleDelete = async (file: CustomUpload) => {
    setConfirmationModal(true);
    setModalProps({
      items: [file],
      action: async () => {
        setConfirmationModal(false);
        const response = await remove(file._id);
        handleUploadResult([response], t('System', 'Deleted custom file', null, false));
        await revalidator.revalidate();
      },
    });
  };

  const deleteMultiple = async () => {
    const filesToDelete = selectedRows.map(row => row._id);
    setConfirmationModal(false);
    setSelectedRows([]);
    const responses = await Promise.all(filesToDelete.map(async fileId => remove(fileId)));
    handleUploadResult(responses, t('System', 'Deleted custom file', null, false));
    await revalidator.revalidate();
  };

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Custom Uploads" />

        <SettingsContent.Body>
          <Table
            data={files}
            columns={createColumns(handleDelete, (file: any) => {
              setShowSidepanel(true);
              setFileToEdit(file);
            })}
            onSelect={({ selectedRows: selected }) => {
              setSelectedRows(files.filter(file => file.rowId in selected));
            }}
            enableSelections
            header={
              <Translate className="text-left text-base font-semibold text-ink">
                Custom Uploads
              </Translate>
            }
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2 justify-end items-center">
          <UploadProgress queueLength={uploadService.getFilesInQueue().length} />
          {selectedRows.length > 0 && (
            <Button
              variant="danger"
              onClick={() => {
                setConfirmationModal(true);
                setModalProps({ items: selectedRows, action: deleteMultiple });
              }}
            >
              <Translate>Delete</Translate>
            </Button>
          )}
          <Button variant="primary" onClick={async () => setShowUploadsModal(true)}>
            <Translate>Import asset</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      <DropzoneModal
        isOpen={showUploadsModal}
        setIsOpen={setShowUploadsModal}
        uploadService={uploadService}
        notify={handleUploadResult}
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
