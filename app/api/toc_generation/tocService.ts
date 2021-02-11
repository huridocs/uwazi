import { files, uploadsPath } from 'api/files';
import request from 'shared/JSONRequest';
import entities from 'api/entities';

const tocService = (serviceUrl: string) => ({
  async processNext() {
    const [nextFile] = await files.get(
      {
        $or: [{ toc: { $size: 0 } }, { toc: { $exists: false } }],
        type: 'document',
        filename: { $exists: true },
      },
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
      serviceUrl,
      nextFile.filename,
      uploadsPath(nextFile.filename)
    );

    await files.save({ ...nextFile, toc, generatedToc: true });
    const [entity] = await entities.get({ sharedId: nextFile.entity }, {});
    return entities.save(
      {
        ...entity,
        generatedToc: true,
      },
      { user: {}, language: nextFile.language },
      false
    );
  },
});

export { tocService };
