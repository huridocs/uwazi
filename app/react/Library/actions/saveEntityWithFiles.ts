import superagent from 'superagent';
import { ClientEntitySchema, ClientFile } from 'app/istore';
import { ensure } from 'shared/tsUtils';

export const readFileAsBase64 = async (file: Blob, cb: (file: any) => void) =>
  new Promise<void>(resolve => {
    const reader = new FileReader();

    reader.onload = base64 => {
      const info = ensure<ArrayBuffer>(base64.target!.result);
      cb(info);
      resolve();
    };
    reader.readAsDataURL(file);
  });

export const constructFile = ({ serializedFile: base64, originalname }: ClientFile) => {
  const fileParts = base64!.split(',');
  const fileFormat = fileParts[0].split(';')[0].split(':')[1];
  const fileContent = fileParts[1];
  const buff = Buffer.from(fileContent, 'base64');

  return new File([buff], originalname || '', { type: fileFormat });
};

export const saveEntityWithFiles = async (entity: ClientEntitySchema) =>
  new Promise((resolve, reject) => {
    const [attachments, supportingFiles] = entity.attachments
      ? entity.attachments.reduce(
          (accumulator, attachmentInfo) => {
            const { serializedFile, ...attachment } = attachmentInfo;
            accumulator[0].push(attachment);
            if (serializedFile) {
              accumulator[1].push(constructFile(attachmentInfo));
            }
            return accumulator;
          },
          [[], []] as [ClientFile[], File[]]
        )
      : [[], []];

    //remove stringify
    const request = superagent
      .post('/api/entities_with_files')
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field(
        'entity',
        JSON.stringify({
          ...entity,
          ...(attachments.length > 0 && { attachments }),
        })
      );

    supportingFiles.forEach((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.attach(`attachments[${index}]`, file);
    });

    return request.end((err, res) => {
      if (err) return reject(err);
      return resolve(res.body);
    });
  });
