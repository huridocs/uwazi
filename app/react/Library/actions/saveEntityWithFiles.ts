import superagent from 'superagent';
import { Dispatch } from 'redux';
import { isObject, isString } from 'lodash';
import { ClientBlobFile, ClientEntitySchema, ClientFile } from 'app/istore';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';
import { ensure } from 'shared/tsUtils';
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

const isBlobFile = (file: unknown): file is ClientBlobFile =>
  isObject(file) && isString((file as ClientBlobFile).data);

const saveEntityWithFiles = async (entity: ClientEntitySchema, dispatch?: Dispatch<{}>) =>
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

    const { documents, ...entityToSave } = entity;

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

    const newDocuments = (documents || []).filter(document =>
      isBlobFile(document)
    ) as ClientBlobFile[];

    if (newDocuments.length > 0) {
      newDocuments.map(async (file, index) => {
        const blob = await fetch(file.data).then(async response => response.blob());
        const document = new File([blob], file.originalFile.name, { type: blob.type });
        URL.revokeObjectURL(file.data);
        return request.attach(`documents[${index}]`, document);
      });
    }

    return request.end((err, res) => {
      if (err) return reject(err);
      return resolve(res.body);
    });
  });

export { readFileAsBase64, saveEntityWithFiles };
