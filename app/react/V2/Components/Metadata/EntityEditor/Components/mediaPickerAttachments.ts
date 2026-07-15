import { mimeTypeFromUrl } from '#api/files/extensionHelper.js';
import type { ClientFile } from '#app/istore.js';
import { FileType } from '#shared/types/fileType.js';

type MediaPickerMode = 'image' | 'media';
type MediaPickerAttachment = FileType | ClientFile;

const extractMediaUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  const match = value.match(/^\(([^,]+),/);
  return match ? match[1].trim() : value;
};

const getAttachmentUrl = (attachment: MediaPickerAttachment) =>
  attachment.url || (attachment.filename ? `/api/files/${attachment.filename}` : '');

const getAttachmentSelectionValue = (attachment: MediaPickerAttachment) => {
  if ('fileLocalID' in attachment && attachment.fileLocalID) {
    return attachment.fileLocalID;
  }
  return getAttachmentUrl(attachment);
};

const isImageAttachment = (attachment: MediaPickerAttachment) => {
  const mimetype =
    attachment.mimetype || (attachment.url ? mimeTypeFromUrl(attachment.url) : undefined);
  return Boolean(mimetype?.includes('image'));
};

const isMediaAttachment = (attachment: MediaPickerAttachment) => {
  const mimetype =
    attachment.mimetype || (attachment.url ? mimeTypeFromUrl(attachment.url) : undefined);

  if (mimetype && (mimetype.includes('video') || mimetype.includes('audio'))) {
    return true;
  }

  return Boolean(attachment.url);
};

const filterAttachments = (attachments: MediaPickerAttachment[], mode: MediaPickerMode) => {
  const withMimetype = attachments.map(attachment => ({
    ...attachment,
    mimetype:
      attachment.mimetype ||
      (attachment.url ? mimeTypeFromUrl(attachment.url) : attachment.mimetype),
  }));

  if (mode === 'image') {
    return withMimetype.filter(isImageAttachment);
  }

  return withMimetype.filter(isMediaAttachment);
};

const getFileInputAccept = (mode: MediaPickerMode) =>
  mode === 'image' ? 'image/*' : 'video/*,audio/*';

const attachmentKey = (attachment: MediaPickerAttachment, selectionValue: string) =>
  ('fileLocalID' in attachment && attachment.fileLocalID) ||
  (attachment._id ? String(attachment._id) : undefined) ||
  attachment.filename ||
  attachment.url ||
  selectionValue;

export type { MediaPickerMode, MediaPickerAttachment };
export {
  extractMediaUrl,
  getAttachmentSelectionValue,
  filterAttachments,
  getFileInputAccept,
  attachmentKey,
};
