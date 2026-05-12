import React from 'react';
import { FileType } from '#shared/types/fileType.js';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { FileDropzone } from '#V2/Components/Forms/index.js';
import type { ImageFeedback, ImageSizeRule } from './customUploadImagePickerLib.js';
import { GallerySection } from './GallerySection.js';
import { ImageValidationIconButton } from './ImageValidationIconButton.js';

const ACCEPTED_IMAGE_FILES = {
  'image/*': ['.avif', '.bmp', '.gif', '.ico', '.jpg', '.jpeg', '.png', '.svg', '.webp'],
} as const;

const uploadFileTrailing = (
  file: File,
  getFeedback: (f: File) => ImageFeedback | null
): React.ReactNode => {
  const fb = getFeedback(file);
  return fb ? <ImageValidationIconButton feedback={fb} /> : null;
};

type CustomUploadImagePickerModalProps = {
  selectButtonTitle: React.ReactNode;
  onClose: () => void;
  onDropzoneFiles: (newFiles: File[]) => void | Promise<void>;
  uploadProgress: { filename?: string; progress?: number };
  dropzoneFeedback: ImageFeedback | null;
  validationFeedback: ImageFeedback | null;
  getUploadFileFeedback: (file: File) => ImageFeedback | null;
  images: FileType[];
  emptyGalleryHint: React.ReactNode;
  modalGridPending: boolean;
  sizeRule: ImageSizeRule | undefined;
  modalGridImages: FileType[];
  trimmed: string;
  onPick: (file: FileType) => void | Promise<void>;
};

const CustomUploadImagePickerModal = ({
  selectButtonTitle,
  onClose,
  onDropzoneFiles,
  uploadProgress,
  dropzoneFeedback,
  validationFeedback,
  getUploadFileFeedback,
  images,
  emptyGalleryHint,
  modalGridPending,
  sizeRule,
  modalGridImages,
  trimmed,
  onPick,
}: CustomUploadImagePickerModalProps) => (
  <Modal size="xxl">
    <Modal.Header>
      {selectButtonTitle}
      <Modal.CloseButton onClick={onClose} />
    </Modal.Header>
    <Modal.Body className="!p-4">
      <div className="min-w-0 space-y-4">
        <div className="min-w-0 rounded-lg border p-4 bg-(--color-theme-surface-warm) [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]">
          <FileDropzone
            className="w-full min-w-0 max-w-full"
            acceptedFiles={ACCEPTED_IMAGE_FILES}
            multiple={false}
            fileTrailing={file => uploadFileTrailing(file, getUploadFileFeedback)}
            onChange={newFiles => {
              Promise.resolve(onDropzoneFiles(newFiles)).catch(() => undefined);
            }}
          />
          <div className="mt-3 min-w-0 text-xs text-(--color-theme-text-tertiary)">
            {uploadProgress.filename ? (
              <>
                <Translate>Uploading</Translate> {uploadProgress.filename}{' '}
                {uploadProgress.progress ?? 0}%
              </>
            ) : null}
          </div>
          {dropzoneFeedback || validationFeedback ? (
            <p
              className={`mt-2 text-xs ${
                (dropzoneFeedback?.type ?? validationFeedback?.type) === 'error'
                  ? 'text-(--color-theme-feedback-danger)'
                  : 'text-(--color-theme-warning)'
              }`}
            >
              {dropzoneFeedback?.message ?? validationFeedback?.message}
            </p>
          ) : null}
        </div>

        <GallerySection
          images={images}
          emptyGalleryHint={emptyGalleryHint}
          modalGridPending={modalGridPending}
          sizeRule={sizeRule}
          modalGridImages={modalGridImages}
          trimmed={trimmed}
          onPick={onPick}
        />
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button type="button" variant="secondary" onClick={onClose}>
        <Translate>Cancel</Translate>
      </Button>
    </Modal.Footer>
  </Modal>
);

export { CustomUploadImagePickerModal };
export type { CustomUploadImagePickerModalProps };
