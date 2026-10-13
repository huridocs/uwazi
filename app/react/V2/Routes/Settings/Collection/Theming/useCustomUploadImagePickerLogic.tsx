import { useEffect, useState } from 'react';
import { useRevalidator } from 'react-router';
import { FileType } from '#shared/types/fileType.js';
import {
  assetUrl,
  getImageFeedback,
  sizeRuleKey,
  type ImageDimensions,
  type ImageFeedback,
  type ImageSizeRule,
} from './customUploadImagePickerLib.js';
import { useCustomUploadPickerBasics } from './useCustomUploadPickerBasics.js';
import { useImageValidators } from './useImageValidators.js';
import { useModalGridFilter } from './useModalGridFilter.js';
import {
  acceptPick,
  clearUploadDraft,
  publishUpload,
  type PendingConfirm,
  type UploadController,
} from './customUploadPickerUpload.js';

const localFileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

type Args = {
  sizeRule: ImageSizeRule | undefined;
  files: FileType[];
  value: string | undefined;
  onChange: (url: string) => void;
  adjustable?: boolean;
};

type PickerBasics = ReturnType<typeof useCustomUploadPickerBasics>;
type Validators = ReturnType<typeof useImageValidators>;

type PickerController = UploadController & {
  sizeRule: ImageSizeRule | undefined;
  validateFiles: Validators['validateFiles'];
  uploadService: PickerBasics['uploadService'];
};

const useUploadDraft = (open: boolean) => {
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ filename?: string; progress?: number }>(
    {}
  );
  const [dropzoneFeedback, setDropzoneFeedback] = useState<ImageFeedback | null>(null);
  const [uploadFileFeedback, setUploadFileFeedback] = useState<
    Record<string, ImageFeedback | null>
  >({});
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [adjustSrc, setAdjustSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFilesToUpload([]);
      setDropzoneFeedback(null);
      setUploadFileFeedback({});
    }
  }, [open]);

  return {
    filesToUpload,
    setFilesToUpload,
    uploading,
    setUploading,
    uploadProgress,
    setUploadProgress,
    dropzoneFeedback,
    setDropzoneFeedback,
    uploadFileFeedback,
    setUploadFileFeedback,
    confirm,
    setConfirm,
    adjustSrc,
    setAdjustSrc,
  };
};

const useSelectedImageFeedback = (selection: {
  trimmed: string;
  sizeRule: ImageSizeRule | undefined;
  ruleKey: string;
  validateAssetUrl: Validators['validateAssetUrl'];
}) => {
  const [validationFeedback, setValidationFeedback] = useState<ImageFeedback | null>(null);
  const { trimmed, sizeRule, ruleKey, validateAssetUrl } = selection;

  useEffect(() => {
    let cancelled = false;
    const syncValidation = async () => {
      if (!trimmed || !sizeRule) {
        if (!cancelled) setValidationFeedback(null);
        return;
      }
      const feedback = await validateAssetUrl(trimmed);
      if (!cancelled) setValidationFeedback(feedback);
    };
    syncValidation().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [trimmed, ruleKey, sizeRule, validateAssetUrl]);

  return { validationFeedback, setValidationFeedback };
};

const usePickerActions = (controller: PickerController) => {
  const revalidator = useRevalidator();
  const handleUpload = async (pendingFiles: File[] = controller.filesToUpload) => {
    if (!pendingFiles.length) return;
    controller.setUploading(true);
    controller.uploadService.onProgress((filename, progress) => {
      controller.setUploadProgress({ filename, progress });
    });
    const responses = await controller.uploadService.upload([...pendingFiles]);
    await publishUpload(controller, responses, async () => {
      await revalidator.revalidate();
    });
    clearUploadDraft(controller);
  };

  const handleDropzoneFiles = async (newFiles: File[]) => {
    const result = await controller.validateFiles(newFiles);
    controller.setFilesToUpload(result.acceptedFiles);
    controller.setDropzoneFeedback(result.feedback?.type === 'error' ? result.feedback : null);
    controller.setUploadFileFeedback(
      Object.fromEntries(result.perFile.map(({ file, feedback }) => [localFileKey(file), feedback]))
    );
    if (result.feedback?.type === 'error' || result.acceptedFiles.length === 0) return;
    await handleUpload(result.acceptedFiles);
  };

  const pick = async (file: FileType) => {
    const url = assetUrl(file);
    const feedback = await controller.validateAssetUrl(url);
    controller.setValidationFeedback(feedback);
    if (feedback?.type === 'error') return;
    if (feedback?.type === 'warning') {
      controller.setConfirm({ message: feedback.message, action: 'pick', url });
      return;
    }
    controller.onChange(url);
    controller.setOpen(false);
  };

  const acceptConfirm = async () => {
    const pending = controller.confirm;
    controller.setConfirm(null);
    if (!pending) return;
    if (pending.action === 'pick') {
      acceptPick(controller, pending.url);
      return;
    }
    await handleUpload(pending.action === 'adjusted' ? [pending.file] : pending.files);
    if (pending.action === 'adjusted') controller.setAdjustSrc(null);
  };

  const submitAdjusted = async (file: File, dimensions: ImageDimensions) => {
    const feedback = controller.sizeRule ? getImageFeedback(controller.sizeRule, dimensions) : null;
    if (feedback?.type === 'error') {
      controller.setValidationFeedback(feedback);
      return;
    }
    if (feedback?.type === 'warning') {
      controller.setConfirm({ message: feedback.message, action: 'adjusted', file });
      return;
    }
    await handleUpload([file]);
    controller.setAdjustSrc(null);
  };

  const getUploadFileFeedback = (file: File) =>
    controller.uploadFileFeedback[localFileKey(file)] ?? null;

  return {
    handleDropzoneFiles,
    getUploadFileFeedback,
    pick,
    handleUpload,
    acceptConfirm,
    submitAdjusted,
  };
};

export const useCustomUploadImagePickerLogic = ({
  sizeRule,
  files,
  value,
  onChange,
  adjustable = false,
}: Args) => {
  const [open, setOpen] = useState(false);
  const draft = useUploadDraft(open);
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
  const { validationFeedback, setValidationFeedback } = useSelectedImageFeedback({
    trimmed,
    sizeRule,
    ruleKey,
    validateAssetUrl,
  });
  const actions = usePickerActions({
    ...draft,
    adjustable,
    sizeRule,
    onChange,
    setOpen,
    setValidationFeedback,
    validateAssetUrl,
    validateFiles,
    uploadService,
  });

  return {
    open,
    setOpen,
    trimmed,
    images,
    filesToUpload: draft.filesToUpload,
    setFilesToUpload: draft.setFilesToUpload,
    uploading: draft.uploading,
    dropzoneFeedback: draft.dropzoneFeedback,
    validationFeedback,
    setValidationFeedback,
    uploadProgress: draft.uploadProgress,
    modalGridImages,
    modalGridPending,
    validateFiles,
    sizeRule,
    confirm: draft.confirm,
    cancelConfirm: () => draft.setConfirm(null),
    adjustSrc: draft.adjustSrc,
    setAdjustSrc: draft.setAdjustSrc,
    ...actions,
  };
};
