import React, { useMemo, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import { FileDropzone, Select } from '#V2/Components/Forms/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { create } from '#V2/api/csv/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';

type DropzoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const UploadFileModal = ({ isOpen, onClose }: DropzoneModalProps) => {
  const revalidator = useRevalidator();
  const [fileToUpload, setFileToUpload] = useState<File | undefined>();
  const [progress, setProgress] = useState<number>(0);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [uploading, setIsUploading] = useState(false);
  const templates = useAtomValue(templatesAtom);

  const onProgress = (completed: number, total: number) => {
    setProgress((completed / total) * 100);
  };

  const handleClose = () => {
    setIsUploading(false);
    setTemplateId(undefined);
    setFileToUpload(undefined);
    onClose();
  };

  const handleUpload = async () => {
    if (fileToUpload && templateId) {
      setIsUploading(true);
      setProgress(0);
      const response = await create(fileToUpload, templateId, onProgress);
      if ('error' in response) {
        console.log(response);
      } else {
        await revalidator.revalidate();
        handleClose();
      }
    }
  };

  const options = useMemo(
    () =>
      templates.map(template => ({
        value: template._id,
        label: t(template._id, template.name, null, false),
      })),
    [templates]
  );

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
            message={<Translate className="text-gray-500 italic">CSV or ZIP up to 50MB</Translate>}
            maxSize={52428800}
          />
          <Select
            id="template-select"
            label={<Translate>Template</Translate>}
            options={options}
            onChange={event => setTemplateId(event.target.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex gap-4 w-full">
          <Button
            className="w-1/2"
            styling="outline"
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
            disabled={!fileToUpload || uploading}
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
