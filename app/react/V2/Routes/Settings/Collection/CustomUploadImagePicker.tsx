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
type ImageSizePolicy = 'strict' | 'soft';
type ImageDimensions = { width: number; height: number };
type ImageSizeRule = {
  width: number;
  height: number;
  policy: ImageSizePolicy;
  assetLabel: 'favicon' | 'logotype';
};
type ImageFeedback = {
  type: 'warning' | 'error';
  message: string;
};

const assetUrl = (file: FileType): string => {
  const u = file.url?.trim();
  if (u) return u;
  if (file.filename) return `/assets/${file.filename}`;
  return '';
};

const isImageFile = (file: FileType): boolean => Boolean(file.mimetype?.startsWith('image/'));

const loadImageDimensions = async (src: string): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

const loadFileDimensions = async (file: File): Promise<ImageDimensions> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await loadImageDimensions(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const expectedSize = (rule: ImageSizeRule) => `${rule.width}x${rule.height} px`;
const currentSize = (dimensions: ImageDimensions) => `${dimensions.width}x${dimensions.height} px`;

const getImageFeedback = (
  rule: ImageSizeRule,
  dimensions: ImageDimensions
): ImageFeedback | null => {
  if (dimensions.width === rule.width && dimensions.height === rule.height) {
    return null;
  }

  const message =
    rule.policy === 'strict'
      ? `The ${rule.assetLabel} must be exactly ${expectedSize(rule)}. This image is ${currentSize(
          dimensions
        )}.`
      : `The ${rule.assetLabel} works best at ${expectedSize(rule)}. This image is ${currentSize(
          dimensions
        )}.`;

  return {
    type: rule.policy === 'strict' ? 'error' : 'warning',
    message,
  };
};

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

const defaultPreviewClass = 'max-h-full max-w-full object-contain';

const defaultPreviewWrapperClass =
  'flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded border p-2 [background-color:var(--color-theme-surface-warm)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]';

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
  sizeRule?: ImageSizeRule;
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
  sizeRule,
}: CustomUploadImagePickerProps) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [open, setOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<ImageFeedback | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ filename?: string; progress?: number }>(
    {}
  );
  const uploadService = useMemo(() => new UploadService('custom'), []);
  const images = useMemo(() => files.filter(isImageFile), [files]);
  const trimmed = value?.trim() ?? '';
  const sizeRuleKey = sizeRule
    ? `${sizeRule.assetLabel}:${sizeRule.policy}:${sizeRule.width}x${sizeRule.height}`
    : '';

  const feedbackStyle = (type: ImageFeedback['type']) =>
    type === 'error'
      ? {
          backgroundColor: 'var(--color-theme-feedback-danger-tint)',
          borderColor: 'color-mix(in srgb, var(--color-theme-feedback-danger) 35%, transparent)',
          color: 'var(--color-theme-feedback-danger)',
        }
      : {
          backgroundColor: 'var(--color-theme-warning-banner-bg)',
          borderColor: 'var(--color-theme-warning-banner-border)',
          color: 'var(--color-theme-warning-banner-fg)',
        };

  const notifyFeedback = (feedback: ImageFeedback) => {
    setNotifications({
      type: feedback.type,
      text: feedback.message,
    });
  };

  const validateAssetUrl = async (url: string) => {
    if (!sizeRule || !url.trim()) {
      return null;
    }

    try {
      const dimensions = await loadImageDimensions(url);
      return getImageFeedback(sizeRule, dimensions);
    } catch {
      return null;
    }
  };

  const validateFiles = async (newFiles: File[]) => {
    if (!sizeRule || newFiles.length === 0) {
      return { acceptedFiles: newFiles, feedback: null as ImageFeedback | null };
    }

    const validations = await Promise.all(
      newFiles.map(async file => {
        try {
          return {
            file,
            feedback: getImageFeedback(sizeRule, await loadFileDimensions(file)),
          };
        } catch {
          return { file, feedback: null as ImageFeedback | null };
        }
      })
    );

    return {
      acceptedFiles:
        sizeRule.policy === 'strict'
          ? validations
              .filter(validation => validation.feedback?.type !== 'error')
              .map(validation => validation.file)
          : newFiles,
      feedback: validations.find(validation => validation.feedback)?.feedback ?? null,
    };
  };

  const pick = async (file: FileType) => {
    const url = assetUrl(file);
    const feedback = await validateAssetUrl(url);

    setValidationFeedback(feedback);

    if (feedback?.type === 'error') {
      notifyFeedback(feedback);
      return;
    }

    if (feedback) {
      notifyFeedback(feedback);
    }

    onChange(url);
    setOpen(false);
  };

  React.useEffect(() => () => uploadService.abort(), [uploadService]);
  React.useEffect(() => {
    let cancelled = false;

    const syncValidation = async () => {
      if (!trimmed || !sizeRule) {
        if (!cancelled) {
          setValidationFeedback(null);
        }
        return;
      }

      const feedback = await validateAssetUrl(trimmed);
      if (!cancelled) {
        setValidationFeedback(feedback);
      }
    };

    void syncValidation();

    return () => {
      cancelled = true;
    };
  }, [trimmed, sizeRuleKey]);

  const notifyUploadResult = (responses: (FileType | FetchResponseError)[]) => {
    const hasErrors = responses.some(
      response => response instanceof FetchResponseError || !response._id
    );
    const hasSuccess = responses.some(
      response => !(response instanceof FetchResponseError) && response._id
    );

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
      const uploadedUrl = assetUrl(uploadedImage);
      const feedback = await validateAssetUrl(uploadedUrl);

      setValidationFeedback(feedback);

      if (feedback?.type === 'error') {
        notifyFeedback(feedback);
        setFilesToUpload([]);
        setUploadProgress({});
        setUploading(false);
        return;
      }

      if (feedback) {
        notifyFeedback(feedback);
      }

      onChange(uploadedUrl);
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
        <div className="mt-1 text-xs [color:var(--color-theme-text-muted)]">
          <Translate>Recommended</Translate>: {recommendedSize}
        </div>
      ) : null}
      {validationFeedback ? (
        <div
          className="mt-2 rounded-lg border px-3 py-2 text-xs"
          style={feedbackStyle(validationFeedback.type)}
        >
          {validationFeedback.message}
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
              <div className="rounded-lg border p-4 [background-color:var(--color-theme-surface-warm)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]">
                <p className="mb-3 text-sm font-medium [color:var(--color-theme-text-primary)]">
                  <Translate>Upload a new image</Translate>
                </p>
                <FileDropzone
                  className="w-auto"
                  onChange={async (newFiles: File[]) => {
                    const { acceptedFiles, feedback } = await validateFiles(newFiles);

                    setFilesToUpload(acceptedFiles);
                    setValidationFeedback(feedback);

                    if (feedback) {
                      notifyFeedback(feedback);
                    }
                  }}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs [color:var(--color-theme-text-muted)]">
                    {uploadProgress.filename ? (
                      <>
                        <Translate>Uploading</Translate> {uploadProgress.filename}{' '}
                        {uploadProgress.progress ?? 0}%
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
                <div className="text-sm [color:var(--color-theme-text-secondary)]">
                  <Translate>Site logo no images hint</Translate>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium [color:var(--color-theme-text-primary)]">
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
                            onClick={async () => pick(file)}
                            className="flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors"
                            style={{
                              borderColor: selected
                                ? 'var(--color-theme-action-primary)'
                                : 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
                              boxShadow: selected
                                ? '0 0 0 2px var(--color-theme-action-primary)'
                                : undefined,
                            }}
                          >
                            <span className="flex h-24 items-center justify-center p-2 [background-color:var(--color-theme-surface-warm)]">
                              <img
                                src={url}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            </span>
                            <span className="truncate border-t px-2 py-1.5 text-xs [color:var(--color-theme-text-secondary)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]">
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
