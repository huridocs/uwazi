import superagent from 'superagent';
import { Dispatch } from 'redux';
import { ClientBlobFile, ClientEntitySchema, ClientFile } from 'app/istore';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';
import { ensure, isBlobFile } from 'shared/tsUtils';
import { constructFile } from 'shared/fileUploadUtils';

const readFileAsBase64 = async (file: Blob, cb: (file: any) => void) =>
  new Promise<void>(resolve => {
    const reader = new FileReader();

    reader.onload = base64 => {
      const info = ensure<ArrayBuffer>(base64.target!.result);
      cb(info);
      resolve();
    };
    reader.readAsDataURL(file);
  });

const saveEntityWithFiles = async (entity: ClientEntitySchema, dispatch?: Dispatch<{}>) => {
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

  const { documents, ...entityToSave } = entity;

  const newDocuments = (entity.documents || []).filter(document =>
    isBlobFile(document)
  ) as ClientBlobFile[];

  const addedDocuments = await Promise.all(
    newDocuments.map(async file => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      const blob = await fetch(file.data).then(async r => r.blob());
      const newDocument = new File([blob], file.originalFile.name, { type: blob.type });
      URL.revokeObjectURL(file.data);
      return newDocument;
    })
  );

  return new Promise((resolve, reject) => {
    const request = superagent
      .post('/api/entities')
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field(
        'entity',
        JSON.stringify({
          ...entityToSave,
          ...(attachments.length > 0 && { attachments }),
        })
      );

    if (dispatch) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.on('progress', data => {
        dispatch({
          type: attachmentsTypes.ATTACHMENT_PROGRESS,
          entity: entity.sharedId || 'NEW_ENTITY',
          progress: data.percent ? Math.floor(data.percent) : data.percent,
        });
      });
    }

    supportingFiles.forEach((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.attach(`attachments[${index}]`, file);
    });

    addedDocuments.forEach((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.attach(`documents[${index}]`, file);
    });

    return request.end((err, res) => {
      if (err) return reject(err);
      return resolve(res.body);
    });
  });
};

export { readFileAsBase64, saveEntityWithFiles };
