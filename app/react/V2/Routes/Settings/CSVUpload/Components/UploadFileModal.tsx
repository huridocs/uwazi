import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import { FileDropzone, Select } from '#V2/Components/Forms/index.js';
import { sortAvailableTemplates } from '#V2/Components/Metadata/EntityEditor/functions/sortAvailableTemplates.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { create, CsvImportStatus } from '#V2/api/csv/index.js';
import { buildTaskLabel } from '../csvImportTaskProgress.js';
import { statusMessages } from './statusMessages.js';
import { localeAtom, templatesAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { reportErrorToSentry } from '#V2/shared/errorUtils.js';

type DropzoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const templateOptions = (templates: { _id: string; name: string }[], locale: string) => [
  { value: '', label: t('System', 'Select template…', null, false), disabled: true },
  ...sortAvailableTemplates(
    templates.map(template => ({
      searchLabel: t(template._id, template.name, null, false),
      value: template._id,
    })),
    locale
  ).map(option => ({ value: option.value, label: option.searchLabel })),
];

const useTemplateOptions = () => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';

  return useMemo(() => templateOptions(templates, locale), [locale, templates]);
};

const UploadFileModal = ({ isOpen, onClose }: DropzoneModalProps) => {
  const [fileToUpload, setFileToUpload] = useState<File | undefined>();
  const [progress, setProgress] = useState<number>(0);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [uploading, setIsUploading] = useState(false);
  const options = useTemplateOptions();
  const { notify, registerTask } = useRequestStatus();

  const onProgress = (completed: number) => {
    setProgress(completed);
  };

  const handleClose = () => {
    setIsUploading(false);
    setFileToUpload(undefined);
    setTemplateId(undefined);
    onClose();
  };

  const handleUpload = async () => {
    if (fileToUpload && templateId) {
      setIsUploading(true);
      setProgress(0);
      const response = await create(fileToUpload, templateId, onProgress);
      if ('error' in response) {
        reportErrorToSentry(new Error(response.error), 'Error uploading file (CSV V2)');
        notify('error', t('System', 'An error occurred', null, false));
      } else {
        registerTask(
          response.id,
          buildTaskLabel(statusMessages[CsvImportStatus.Queued].title, fileToUpload.name),
          undefined,
          0
        );
      }
      handleClose();
    }
  };

  return isOpen ? (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Import CSV</Translate>
        <Modal.CloseButton
          disabled={uploading}
          onClick={() => {
            handleClose();
          }}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-8">
          <FileDropzone
            className="w-auto md:min-w-72"
            onChange={(files: File[]) => {
              setFileToUpload(files[0]);
            }}
            multiple={false}
            acceptedFiles={{
              'text/csv': ['.csv'],
              'application/zip': ['.zip'],
            }}
            message={<Translate className="italic text-ink-muted">CSV or ZIP</Translate>}
          />
          <Select
            id="template-select"
            label={<Translate>Template</Translate>}
            options={options}
            onChange={event => setTemplateId(event.target.value)}
            value={templateId ?? ''}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex gap-4 w-full">
          <Button
            className="w-1/2"
            variant="secondary"
            onClick={() => {
              handleClose();
            }}
            disabled={uploading}
          >
            <Translate>Cancel</Translate>
          </Button>
          <Button
            className="w-1/2"
            onClick={async () => handleUpload()}
            disabled={!fileToUpload || !templateId || uploading}
          >
            {!uploading && <Translate>Accept</Translate>}
            {uploading && (
              <span>
                <Translate>Uploading</Translate>... <span> {progress}%</span>
              </span>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  ) : (
    <div />
  );
};

export { UploadFileModal };
