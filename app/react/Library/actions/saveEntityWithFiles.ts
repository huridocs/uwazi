import superagent, { MultipartValueSingle } from 'superagent';
import { Dispatch } from 'redux';
import { groupBy } from 'lodash';
import { ClientBlobFile, ClientEntitySchema, ClientFile } from 'app/istore';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';
import * as uploadsActionTypes from 'app/Uploads/actions/actionTypes';
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

  const { oldDocuments = [], newDocuments = [] } = groupBy(entity.documents || [], document =>
    document._id !== undefined ? 'oldDocuments' : 'newDocuments'
  );
  const entityToSave = { ...entity, documents: oldDocuments };

  const addedDocuments = await Promise.all(
    (newDocuments as ClientBlobFile[]).map(async file => {
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
        if (data.percent && Math.floor(data.percent) === 100) {
          return dispatch({
            type: attachmentsTypes.ATTACHMENT_LOCAL_COMPLETE,
            entity: entity.sharedId || 'NEW_ENTITY',
          });
        }

        return dispatch({
          type: attachmentsTypes.ATTACHMENT_PROGRESS,
          entity: entity.sharedId || 'NEW_ENTITY',
          progress: data.percent ? Math.floor(data.percent) : data.percent,
        });
      });
    }

    supportingFiles.forEach((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.attach(`attachments[${index}]`, file as unknown as MultipartValueSingle);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.field(`attachments_originalname[${index}]`, file.name);
    });

    addedDocuments.forEach((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.attach(`documents[${index}]`, file as unknown as MultipartValueSingle);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.field(`documents_originalname[${index}]`, file.name);
    });

    request.end((err, res) => {
      if (err) return reject(err);

      if (dispatch && addedDocuments.length) {
        dispatch({
          type: uploadsActionTypes.NEW_UPLOAD_DOCUMENT,
          doc: res.body.entity.sharedId,
        });
      }
      resolve(res.body);
    });
  });
};

export { readFileAsBase64, saveEntityWithFiles };
