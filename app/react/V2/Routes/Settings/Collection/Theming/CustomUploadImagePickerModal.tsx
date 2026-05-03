import React from 'react';
import { FileType } from '#shared/types/fileType.js';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { FileDropzone } from '#V2/Components/Forms/index.js';
import type { ImageFeedback, ImageSizeRule } from './customUploadImagePickerLib.js';
import { GallerySection } from './GallerySection.js';
import { ImageValidationIconButton } from './ImageValidationIconButton.js';

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
  filesToUpload: File[];
  uploading: boolean;
  uploadProgress: { filename?: string; progress?: number };
  onUpload: () => void;
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
  filesToUpload,
  uploading,
  uploadProgress,
  onUpload,
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
        <div className="min-w-0 rounded-lg border p-4 [background-color:var(--color-theme-surface-warm)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]">
          <p className="mb-3 text-sm font-medium [color:var(--color-theme-text-primary)]">
            <Translate>Upload a new image</Translate>
          </p>
          <FileDropzone
            className="w-full min-w-0 max-w-full"
            fileTrailing={file => uploadFileTrailing(file, getUploadFileFeedback)}
            onChange={newFiles => {
              Promise.resolve(onDropzoneFiles(newFiles)).catch(() => undefined);
            }}
          />
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0 text-xs [color:var(--color-theme-text-muted)]">
              {uploadProgress.filename ? (
                <>
                  <Translate>Uploading</Translate> {uploadProgress.filename}{' '}
                  {uploadProgress.progress ?? 0}%
                </>
              ) : null}
            </div>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={onUpload}
              disabled={uploading || filesToUpload.length === 0}
            >
              <Translate>Upload image</Translate>
            </Button>
          </div>
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
