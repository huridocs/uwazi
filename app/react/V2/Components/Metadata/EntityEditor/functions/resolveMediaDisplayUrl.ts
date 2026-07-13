import type { ClientFile } from '#app/istore.js';
import { prepareHTMLMediaView } from '#shared/fileUploadUtils.js';
import type { FileType } from '#shared/types/fileType.js';
import { isUploadId } from '#V2/api/entities/save/index.js';

const getAttachmentUrl = (file: FileType) =>
  file.url || (file.filename ? `/api/files/${file.filename}` : '');

const resolveMediaDisplayUrl = (
  rawValue: string,
  attachments: Array<FileType | ClientFile>
): string => {
  if (!rawValue || rawValue.startsWith('blob:') || rawValue.startsWith('http')) {
    return rawValue;
  }

  if (rawValue.startsWith('(')) {
    const match = rawValue.match(/^\(([^,]+),/);
    const id = match?.[1]?.trim();
    if (!id) {
      return rawValue;
    }

    if (isUploadId(id)) {
      const file = attachments.find(
        attachment => 'fileLocalID' in attachment && attachment.fileLocalID === id
      ) as ClientFile | undefined;
      if (file?.serializedFile) {
        return prepareHTMLMediaView(file);
      }
    }

    return rawValue;
  }

  if (isUploadId(rawValue)) {
    const file = attachments.find(
      attachment => 'fileLocalID' in attachment && attachment.fileLocalID === rawValue
    ) as ClientFile | undefined;
    if (file?.serializedFile) {
      return prepareHTMLMediaView(file);
    }
  }

  const attachment = attachments.find(file => getAttachmentUrl(file) === rawValue);
  return attachment ? getAttachmentUrl(attachment) : rawValue;
};

export { resolveMediaDisplayUrl };
