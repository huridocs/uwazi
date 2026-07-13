import { readFileAsBase64 } from '#app/Library/actions/saveEntityWithFiles.js';
import type { ClientFile } from '#app/istore.js';
import uniqueID from '#shared/uniqueID.js';

const registerMediaAttachment = async (
  entitySharedId: string,
  file: File,
  fileLocalID = uniqueID()
): Promise<ClientFile> =>
  new Promise((resolve, reject) => {
    readFileAsBase64(file, serializedFile => {
      resolve({
        _id: fileLocalID,
        originalname: file.name,
        filename: file.name,
        serializedFile,
        type: 'attachment',
        mimetype: file.type,
        entity: entitySharedId,
        fileLocalID,
      });
    }).catch(reject);
  });

export { registerMediaAttachment };
