import { useEffect, useState } from 'react';
import { useRevalidator } from 'react-router';
import { FileType } from '#shared/types/fileType.js';
import { t } from '#app/I18N/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import {
  assetUrl,
  isImageFile,
  sizeRuleKey,
  type ImageFeedback,
  type ImageSizeRule,
} from './customUploadImagePickerLib.js';
import { useCustomUploadPickerBasics } from './useCustomUploadPickerBasics.js';
import { useImageValidators } from './useImageValidators.js';
import { useModalGridFilter } from './useModalGridFilter.js';

const localFileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

type Args = {
  sizeRule: ImageSizeRule | undefined;
  files: FileType[];
  value: string | undefined;
  onChange: (url: string) => void;
};

export const useCustomUploadImagePickerLogic = ({ sizeRule, files, value, onChange }: Args) => {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<ImageFeedback | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ filename?: string; progress?: number }>(
    {}
  );
  const [dropzoneFeedback, setDropzoneFeedback] = useState<ImageFeedback | null>(null);
  const [uploadFileFeedback, setUploadFileFeedback] = useState<
    Record<string, ImageFeedback | null>
  >({});
  const { uploadService, images, imagesKey } = useCustomUploadPickerBasics(files);
  const { validateAssetUrl, validateFiles } = useImageValidators(sizeRule);
  const trimmed = value?.trim() ?? '';
  const ruleKey = sizeRuleKey(sizeRule);
  const { modalGridImages, modalGridPending } = useModalGridFilter({
    open,
    sizeRule,
    images,
    ruleKey,
    imagesKey,
  });

  const pick = async (file: FileType) => {
    const url = assetUrl(file);
    const feedback = await validateAssetUrl(url);

    setValidationFeedback(feedback);

    if (feedback?.type === 'error') {
      return;
    }

    onChange(url);
    setOpen(false);
  };

  useEffect(() => {
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

    syncValidation().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [trimmed, ruleKey, sizeRule, validateAssetUrl]);

  useEffect(() => {
    if (!open) {
      setFilesToUpload([]);
      setDropzoneFeedback(null);
      setUploadFileFeedback({});
    }
  }, [open]);

  const getUploadFileFeedback = (file: File) => uploadFileFeedback[localFileKey(file)] ?? null;

  const notifyUploadResult = (responses: (FileType | FetchResponseError)[]) => {
    const hasErrors = responses.some(
      response => response instanceof FetchResponseError || !response._id
    );
    const hasSuccess = responses.some(
      response => !(response instanceof FetchResponseError) && response._id
    );

    if (hasSuccess) {
      notify(t('System', 'Uploaded custom file', null, false), 'success');
    }

    if (hasErrors) {
      notify(t('System', 'An error occurred', null, false), 'error');
    }
  };

  const handleUpload = async (pendingFiles: File[] = filesToUpload) => {
    if (!pendingFiles.length) return;

    setUploading(true);
    uploadService.onProgress((filename, progress) => {
      setUploadProgress({ filename, progress });
    });

    const responses = await uploadService.upload([...pendingFiles]);
    const uploadedImage = responses.find(
      (response): response is FileType =>
        !(response instanceof FetchResponseError) && Boolean(response._id) && isImageFile(response)
    );

    notifyUploadResult(responses);
    await revalidator.revalidate();

    if (uploadedImage) {
      const uploadedUrl = assetUrl(uploadedImage);
      const feedback = await validateAssetUrl(uploadedUrl);

      setValidationFeedback(feedback);

      if (feedback?.type === 'error') {
        setFilesToUpload([]);
        setUploadFileFeedback({});
        setUploadProgress({});
        setUploading(false);
        return;
      }

      onChange(uploadedUrl);
      setOpen(false);
    }

    setFilesToUpload([]);
    setDropzoneFeedback(null);
    setUploadFileFeedback({});
    setUploadProgress({});
    setUploading(false);
  };

  const handleDropzoneFiles = async (newFiles: File[]) => {
    const result = await validateFiles(newFiles);
    setFilesToUpload(result.acceptedFiles);
    setDropzoneFeedback(result.feedback);
    setUploadFileFeedback(
      Object.fromEntries(result.perFile.map(({ file, feedback }) => [localFileKey(file), feedback]))
    );
    if (result.acceptedFiles.length) {
      await handleUpload(result.acceptedFiles);
    }
  };

  return {
    open,
    setOpen,
    trimmed,
    images,
    filesToUpload,
    setFilesToUpload,
    uploading,
    dropzoneFeedback,
    validationFeedback,
    setValidationFeedback,
    uploadProgress,
    modalGridImages,
    modalGridPending,
    validateFiles,
    handleDropzoneFiles,
    getUploadFileFeedback,
    pick,
    handleUpload,
    sizeRule,
  };
};
