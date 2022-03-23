import { ClientFile } from 'app/istore';

export const constructFile = ({ serializedFile: base64, originalname }: ClientFile) => {
  const fileParts = base64!.split(',');
  const fileFormat = fileParts[0].split(';')[0].split(':')[1];
  const fileContent = fileParts[1];
  const buff = Buffer.from(fileContent, 'base64');

  return new File([buff], originalname || '', { type: fileFormat });
};

export const prepareHTMLMediaView = (supportingFile: ClientFile) => {
  const file = constructFile(supportingFile);
  return URL.createObjectURL(file);
};
