import { files, uploadsPath } from 'api/files';
import request from 'shared/JSONRequest';
import entities from 'api/entities';

const tocService = {
  async processNext() {
    const [nextFile] = await files.get(
      { toc: { $exists: false }, type: 'document', filename: { $exists: true } },
      '',
      {
        sort: { _id: 1 },
        limit: 1,
      }
    );

    if (!nextFile) {
      return null;
    }

    const toc = await request.uploadFile(
      'url_toc_service',
      nextFile.filename,
      uploadsPath(nextFile.filename)
    );

    await files.save({ ...nextFile, toc, generatedToc: true });
    const parentEntities = await entities.get({ sharedId: nextFile.entity }, { language: 1 });
    return entities.saveMultiple(
      parentEntities.map(entity => ({
        ...entity,
        systemMetadata: { ...(entity.systemMetadata || {}), generatedToc: [{ value: true }] },
      }))
    );
  },
};

export { tocService };
