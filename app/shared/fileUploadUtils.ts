import { ClientFile } from '#app/istore.js';
import { AttachmentSchema } from './types/commonTypes.js';

const mediaViewUrlById = new Map<string, string>();

const readFileAsBase64 = async (file: Blob, cb: (serializedFile: string) => void): Promise<void> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as base64'));
        return;
      }
      cb(result);
      resolve();
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });

const isSerializedFile = (file: ClientFile | AttachmentSchema): file is ClientFile =>
  (<ClientFile>file).serializedFile !== undefined;

const constructFile = ({ serializedFile: base64, originalname }: ClientFile) => {
  const fileParts = base64!.split(',');
  const fileFormat = fileParts[0].split(';')[0].split(':')[1];
  const fileContent = fileParts[1];
  const buff = Buffer.from(fileContent, 'base64');

  return new File([new Uint8Array(buff)], originalname || '', { type: fileFormat });
};

const prepareHTMLMediaView = (supportingFile: ClientFile) => {
  const key = supportingFile.fileLocalID;
  if (key) {
    const cached = mediaViewUrlById.get(key);
    if (cached) {
      return cached;
    }
  }

  const file = constructFile(supportingFile);
  const url = URL.createObjectURL(file);
  if (key) {
    mediaViewUrlById.set(key, url);
  }
  return url;
};

const revokeHTMLMediaView = (fileLocalID: string) => {
  const url = mediaViewUrlById.get(fileLocalID);
  if (!url) {
    return;
  }
  URL.revokeObjectURL(url);
  mediaViewUrlById.delete(fileLocalID);
};

export {
  readFileAsBase64,
  isSerializedFile,
  constructFile,
  prepareHTMLMediaView,
  revokeHTMLMediaView,
};
