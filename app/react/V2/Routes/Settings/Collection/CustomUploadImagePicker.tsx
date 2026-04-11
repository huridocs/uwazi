import React, { useMemo, useState } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { FileType } from '#shared/types/fileType.js';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import { FileDropzone } from '#V2/Components/Forms/index.js';
import { UploadService } from '#V2/api/files/index.js';
import { notificationAtom } from '#V2/atoms/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

type AssetField = 'site_logo' | 'favicon';

const assetUrl = (file: FileType): string => {
  const u = file.url?.trim();
  if (u) return u;
  if (file.filename) return `/assets/${file.filename}`;
  return '';
};

const isImageFile = (file: FileType): boolean => Boolean(file.mimetype?.startsWith('image/'));

const filenameFromAssetUrl = (valueUrl: string): string | undefined => {
  const m = valueUrl.trim().match(/\/assets\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

const fileMatchesAssetUrl = (file: FileType, valueUrl: string): boolean => {
  if (!valueUrl.trim() || !file.filename) return false;
  const fromUrl = filenameFromAssetUrl(valueUrl);
  if (fromUrl === file.filename) return true;
  return assetUrl(file) === valueUrl.trim();
};

const defaultPreviewClass =
  'max-h-full max-w-full object-contain';

const defaultPreviewWrapperClass =
  'flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 p-2';

type CustomUploadImagePickerProps = {
  id: string;
  registerProps?: UseFormRegisterReturn<AssetField>;
  value: string | undefined;
  onChange: (url: string) => void;
  files: FileType[];
  label: React.ReactNode;
  selectButtonTitle: React.ReactNode;
  previewImgClassName?: string;
  previewWrapperClassName?: string;
  recommendedSize?: string;
};

const CustomUploadImagePicker = ({
  id,
  registerProps,
  value,
  onChange,
  files,
  label,
  selectButtonTitle,
  previewImgClassName = defaultPreviewClass,
  previewWrapperClassName = defaultPreviewWrapperClass,
  recommendedSize,
}: CustomUploadImagePickerProps) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [open, setOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ filename?: string; progress?: number }>({});
  const uploadService = useMemo(() => new UploadService('custom'), []);
  const images = useMemo(() => files.filter(isImageFile), [files]);
  const trimmed = value?.trim() ?? '';
  const pick = (file: FileType) => {
    onChange(assetUrl(file));
    setOpen(false);
  };

  React.useEffect(() => () => uploadService.abort(), [uploadService]);

  const notifyUploadResult = (responses: (FileType | FetchResponseError)[]) => {
    const hasErrors = responses.some(response => response instanceof FetchResponseError || !response._id);
    const hasSuccess = responses.some(response => !(response instanceof FetchResponseError) && response._id);

    if (hasSuccess) {
      setNotifications({
        type: 'success',
        text: <Translate>Uploaded custom file</Translate>,
      });
    }

    if (hasErrors) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
      });
    }
  };

  const handleUpload = async () => {
    if (!filesToUpload.length) return;

    setUploading(true);
    uploadService.onProgress((filename, progress) => {
      setUploadProgress({ filename, progress });
    });

    const responses = await uploadService.upload([...filesToUpload]);
    const uploadedImage = responses.find(
      (response): response is FileType =>
        !(response instanceof FetchResponseError) &&
        Boolean(response._id) &&
        Boolean(response.mimetype?.startsWith('image/'))
    );

    notifyUploadResult(responses);
    await revalidator.revalidate();

    if (uploadedImage) {
      onChange(assetUrl(uploadedImage));
    }

    setFilesToUpload([]);
    setUploadProgress({});
    setUploading(false);
  };

  const actionButton = (
    <Button
      variant="secondary"
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 px-2 py-1.5"
    >
      <ArrowUpTrayIcon className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only">
        {trimmed ? <Translate>Change</Translate> : <Translate>Choose</Translate>}
      </span>
    </Button>
  );

  return (
    <div className="sm:col-span-1">
      {registerProps ? (
        <input type="hidden" id={id} {...registerProps} />
      ) : (
        <input type="hidden" id={id} value={trimmed} readOnly />
      )}
      <Label htmlFor={id}>{label}</Label>
      {recommendedSize ? (
        <div className="mt-1 text-xs text-gray-500">
          <Translate>Recommended</Translate>: {recommendedSize}
        </div>
      ) : null}
      <div className="mt-2 flex flex-col gap-3">
        {trimmed ? (
          <div className="flex flex-wrap items-start gap-2">
            <div className={previewWrapperClassName}>
              <img src={trimmed} alt="" className={previewImgClassName} />
            </div>
            <div className="flex flex-wrap gap-2">
              {actionButton}
              <Button
                variant="dangerSecondary"
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 px-2 py-1.5"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">
                  <Translate>Clear</Translate>
                </span>
              </Button>
            </div>
          </div>
        ) : (
          actionButton
        )}
      </div>

      {open ? (
        <Modal size="xxl">
          <Modal.Header>
            {selectButtonTitle}
            <Modal.CloseButton onClick={() => setOpen(false)} />
          </Modal.Header>
          <Modal.Body className="!p-4">
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-800">
                  <Translate>Upload a new image</Translate>
                </p>
                <FileDropzone
                  className="w-auto"
                  onChange={(newFiles: File[]) => {
                    setFilesToUpload(newFiles);
                  }}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {uploadProgress.filename ? (
                      <>
                        <Translate>Uploading</Translate> {uploadProgress.filename} {uploadProgress.progress ?? 0}%
                      </>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || filesToUpload.length === 0}
                  >
                    <Translate>Upload image</Translate>
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="text-sm text-gray-600">
                  <Translate>Site logo no images hint</Translate>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-800">
                    <Translate>Select an existing image</Translate>
                  </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map(file => {
                  const url = assetUrl(file);
                  const selected = fileMatchesAssetUrl(file, trimmed);
                  return (
                    <li key={String(file._id ?? file.filename)}>
                      <button
                        type="button"
                        onClick={() => pick(file)}
                        className={[
                          'flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors',
                          selected
                            ? 'border-primary-600 ring-2 ring-primary-500'
                            : 'border-gray-200 hover:border-primary-400',
                        ].join(' ')}
                      >
                        <span className="flex h-24 items-center justify-center bg-gray-50 p-2">
                          <img
                            src={url}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                        <span className="truncate border-t border-gray-100 px-2 py-1.5 text-xs text-gray-700">
                          {file.originalname || file.filename}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
                </>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              <Translate>Cancel</Translate>
            </Button>
          </Modal.Footer>
        </Modal>
      ) : null}
    </div>
  );
};

export { CustomUploadImagePicker };
export type { CustomUploadImagePickerProps, AssetField };
