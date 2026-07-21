import superagent, { MultipartValueSingle } from 'superagent';
import { Dispatch } from 'redux';
import groupBy from 'lodash/groupBy.js';
import { ClientBlobFile, ClientEntitySchema, ClientFile } from '#app/istore.js';
import * as attachmentsTypes from '#app/Attachments/actions/actionTypes.js';
import * as uploadsActionTypes from '#app/Uploads/actions/actionTypes.js';

import { constructFile, readFileAsBase64 } from '#shared/fileUploadUtils.js';
import { loadingProgressBar as loadingBar } from '#app/App/LoadingProgressBar.js';

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

  const addedDocuments = (newDocuments as ClientBlobFile[]).map(file => {
    const { originalFile } = file;

    if (file.originalName && file.originalName !== originalFile.name) {
      const type = originalFile.type || undefined;
      return new File([originalFile], file.originalName, { type });
    }

    return originalFile;
  });

  return new Promise((resolve, reject) => {
    loadingBar.start();

    const entityToSend = {
      ...entityToSave,
      ...(attachments.length > 0 && { attachments }),
    };

    const request = superagent
      .post('/api/entities')
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('entity', JSON.stringify(entityToSend));

    if (dispatch) {
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
      request.attach(`attachments[${index}]`, file as unknown as MultipartValueSingle);
      request.field(`attachments_originalname[${index}]`, file.name);
    });

    addedDocuments.forEach((file, index) => {
      request.attach(`documents[${index}]`, file as unknown as MultipartValueSingle);
      request.field(`documents_originalname[${index}]`, file.name);
    });

    request.end((err, res) => {
      loadingBar.done();
      if (!res.ok && (res.body.prettyMessage !== undefined || res.body.error !== undefined)) {
        if (err) {
          reject(
            new Error(
              `${res.body.prettyMessage || res.body.error}. Request Id: ${res.body.requestId}`
            )
          );
        }
      } else if (err) {
        reject(err);
      }

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
