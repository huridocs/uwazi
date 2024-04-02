import React, { useState } from 'react';
import { useRevalidator } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { FetchResponseError } from 'shared/JSONRequest';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { FileDropzone } from 'V2/Components/Forms';
import { Button, Modal } from 'V2/Components/UI';
import { UploadService } from 'V2/api/files';
import { uploadProgressAtom } from './uploadProgressAtom';

type DropzoneModalProps = {
  notify: (responses: (FileType | FetchResponseError)[], message: React.ReactNode) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uploadService: UploadService;
};

const DropzoneModal = ({ notify, isOpen, setIsOpen, uploadService }: DropzoneModalProps) => {
  const revalidator = useRevalidator();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const updateProgress = useSetRecoilState(uploadProgressAtom);

  const handleCancel = () => {
    setIsOpen(false);
    setFilesToUpload([]);
  };

  const handleSave = async () => {
    setIsOpen(false);
    uploadService.onProgress((filename, progress) => {
      updateProgress({ filename, progress });
    });
    uploadService.onUploadComplete(() => {
      revalidator.revalidate();
    });
    const results = await uploadService.upload([...filesToUpload]);
    updateProgress({ filename: undefined, progress: undefined });
    notify(results, <Translate>Uploaded custom file</Translate>);
  };

  return isOpen ? (
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
            setFilesToUpload(newFiles);
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
  ) : (
    <div />
  );
};

export { DropzoneModal };
