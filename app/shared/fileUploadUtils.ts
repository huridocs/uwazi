import { ClientFile } from '#app/istore.js';
import { AttachmentSchema } from './types/commonTypes.js';

export const readFileAsBase64 = async (
  file: Blob,
  cb: (serializedFile: string) => void
): Promise<void> =>
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

export const isSerializedFile = (file: ClientFile | AttachmentSchema): file is ClientFile =>
  (<ClientFile>file).serializedFile !== undefined;

export const constructFile = ({ serializedFile: base64, originalname }: ClientFile) => {
  const fileParts = base64!.split(',');
  const fileFormat = fileParts[0].split(';')[0].split(':')[1];
  const fileContent = fileParts[1];
  const buff = Buffer.from(fileContent, 'base64');

  return new File([new Uint8Array(buff)], originalname || '', { type: fileFormat });
};

export const prepareHTMLMediaView = (supportingFile: ClientFile) => {
  const file = constructFile(supportingFile);
  return URL.createObjectURL(file);
};
