import { FileType } from '#shared/types/fileType.js';
import { t } from '#app/I18N/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { assetUrl, isImageFile, type ImageFeedback } from './customUploadImagePickerLib.js';

type PendingConfirm =
  | { message: string; action: 'pick'; url: string }
  | { message: string; action: 'upload'; files: File[] }
  | { message: string; action: 'adjusted'; file: File };

type UploadResponses = (FileType | FetchResponseError)[];

type UploadDraft = {
  filesToUpload: File[];
  setFilesToUpload: (files: File[]) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: { filename?: string; progress?: number }) => void;
  setDropzoneFeedback: (feedback: ImageFeedback | null) => void;
  uploadFileFeedback: Record<string, ImageFeedback | null>;
  setUploadFileFeedback: (feedback: Record<string, ImageFeedback | null>) => void;
  confirm: PendingConfirm | null;
  setConfirm: (confirm: PendingConfirm | null) => void;
  setAdjustSrc: (src: string | null) => void;
};

type UploadController = UploadDraft & {
  adjustable: boolean;
  onChange: (url: string) => void;
  setOpen: (open: boolean) => void;
  setValidationFeedback: (feedback: ImageFeedback | null) => void;
  validateAssetUrl: (url: string) => Promise<ImageFeedback | null>;
};

const notifyUploadResult = (responses: UploadResponses) => {
  const hasErrors = responses.some(
    response => response instanceof FetchResponseError || !response._id
  );
  const hasSuccess = responses.some(
    response => !(response instanceof FetchResponseError) && response._id
  );
  if (hasSuccess) notify(t('System', 'Uploaded custom file', null, false), 'success');
  if (hasErrors) notify(t('System', 'An error occurred', null, false), 'error');
};

const clearUploadDraft = (draft: UploadDraft) => {
  draft.setFilesToUpload([]);
  draft.setDropzoneFeedback(null);
  draft.setUploadFileFeedback({});
  draft.setUploadProgress({});
  draft.setUploading(false);
};

const imageFromUpload = (responses: UploadResponses) =>
  responses.find(
    (response): response is FileType =>
      !(response instanceof FetchResponseError) && Boolean(response._id) && isImageFile(response)
  );

const applyUploadedFeedback = (
  controller: UploadController,
  uploadedUrl: string,
  feedback: ImageFeedback | null
) => {
  controller.setValidationFeedback(feedback);
  if (feedback?.type === 'error') return;
  if (feedback?.type === 'warning') {
    controller.setConfirm({ message: feedback.message, action: 'pick', url: uploadedUrl });
    return;
  }
  controller.onChange(uploadedUrl);
  controller.setOpen(false);
};

const publishUpload = async (
  controller: UploadController,
  responses: UploadResponses,
  revalidate: () => Promise<void>
) => {
  notifyUploadResult(responses);
  await revalidate();
  const image = imageFromUpload(responses);
  if (!image) return;
  const uploadedUrl = assetUrl(image);
  const feedback = await controller.validateAssetUrl(uploadedUrl);
  applyUploadedFeedback(controller, uploadedUrl, feedback);
};

const acceptPick = (controller: UploadController, url: string) => {
  controller.onChange(url);
  controller.setOpen(false);
  if (controller.adjustable) controller.setAdjustSrc(url);
};

export type { PendingConfirm, UploadController };
export { acceptPick, clearUploadDraft, publishUpload };
