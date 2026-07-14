import type { ClientFile } from '#app/istore.js';
import { prepareHTMLMediaView } from '#shared/fileUploadUtils.js';
import type { FileType } from '#shared/types/fileType.js';
import { isUploadId } from './mediaMetadata.js';

const getAttachmentUrl = (file: FileType) =>
  file.url || (file.filename ? `/api/files/${file.filename}` : '');

const findClientFileByUploadId = (
  uploadId: string,
  attachments: ReadonlyArray<FileType | ClientFile>
): ClientFile | undefined => {
  const match = attachments.find(
    attachment => 'fileLocalID' in attachment && attachment.fileLocalID === uploadId
  );
  return match && 'serializedFile' in match ? match : undefined;
};

const resolveUploadIdUrl = (
  uploadId: string,
  attachments: ReadonlyArray<FileType | ClientFile>
): string | undefined => {
  if (!isUploadId(uploadId)) {
    return undefined;
  }
  const file = findClientFileByUploadId(uploadId, attachments);
  return file?.serializedFile ? prepareHTMLMediaView(file) : undefined;
};

const resolveTimelinkUrl = (
  rawValue: string,
  attachments: ReadonlyArray<FileType | ClientFile>
): string => {
  const id = rawValue.match(/^\(([^,]+),/)?.[1]?.trim();
  if (!id) {
    return rawValue;
  }
  return resolveUploadIdUrl(id, attachments) ?? id;
};

const resolveMediaDisplayUrl = (
  rawValue: string,
  attachments: ReadonlyArray<FileType | ClientFile>
): string => {
  if (!rawValue || rawValue.startsWith('blob:') || rawValue.startsWith('http')) {
    return rawValue;
  }
  if (rawValue.startsWith('(')) {
    return resolveTimelinkUrl(rawValue, attachments);
  }
  const uploadUrl = resolveUploadIdUrl(rawValue, attachments);
  if (uploadUrl) {
    return uploadUrl;
  }
  const attachment = attachments.find(file => getAttachmentUrl(file) === rawValue);
  return attachment ? getAttachmentUrl(attachment) : rawValue;
};

export { resolveMediaDisplayUrl };
