import superagent from 'superagent';
import { Dispatch } from 'redux';
import { ClientEntitySchema, ClientFile } from 'app/istore';
import { ensure } from 'shared/tsUtils';
import { constructFile } from 'shared/fileUploadUtils';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';

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

export const saveEntityWithFiles = async (entity: ClientEntitySchema, dispatch?: Dispatch<{}>) =>
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

    const request = superagent
      .post('/api/entities')
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field(
        'entity',
        JSON.stringify({
          ...entity,
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

    return request.end((err, res) => {
      if (err) return reject(err);
      return resolve(res.body);
    });
  });
