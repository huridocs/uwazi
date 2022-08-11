// eslint-disable-next-line node/no-restricted-import
import { unlink } from 'fs/promises';
import path from 'path';
import { config } from 'api/config';

/* eslint-disable no-await-in-loop */
export default {
  delta: 69,

  name: 'Clean up orphan files',

  description:
    'Removes documents, attachments and thumbnails that do not belong to an existing entity',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const paths = {
      document: config.defaultTenant.uploadedDocuments,
      attachment: config.defaultTenant.attachments,
      thumbnail: config.defaultTenant.uploadedDocuments,
    };

    const cursor = await db.collection('files').find({});
    while (await cursor.hasNext()) {
      const file = await cursor.next();

      if (['document', 'thumbnail', 'attachment'].includes(file.type)) {
        const [entity] = await db.collection('entities').find({ sharedId: file.entity }).toArray();
        if (!entity) {
          await db.collection('files').deleteOne({ _id: file._id });
          try {
            await unlink(path.join(paths[file.type], file.filename));
          } catch (e) {
            if (e.code !== 'ENOENT') {
              throw e;
            }
          }
        }
      }
    }
  },
};
