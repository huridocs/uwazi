import { deleteUploadedFiles } from 'api/files/filesystem';
import connections from 'api/relationships';
import { search } from 'api/search';
import entities from 'api/entities';
import request from 'shared/JSONRequest';
import model from './filesModel';
import { validateFile } from '../../shared/types/fileSchema';
import { FileType } from '../../shared/types/fileType';

export const files = {
  async save(_file: FileType) {
    const file = { ..._file };
    if (file.url && !file._id) {
      const response = await request.head(file.url);
      const mimetype = response.headers.get('content-type') || undefined;
      file.mimetype = mimetype;
    }

    const savedFile = await model.save(await validateFile(file));
    await search.indexEntities({ sharedId: savedFile.entity }, '+fullText');
    return savedFile;
  },

  get: model.get.bind(model),

  async delete(query: any = {}) {
    const toDeleteFiles: FileType[] = await model.get(query);
    await model.delete(query);
    if (toDeleteFiles.length > 0) {
      await connections.delete({ file: { $in: toDeleteFiles.map(f => f._id?.toString()) } });
      await deleteUploadedFiles(toDeleteFiles);
      await search.indexEntities(
        { sharedId: { $in: toDeleteFiles.map(f => f.entity?.toString()) } },
        '+fullText'
      );
    }

    return toDeleteFiles;
  },

  async tocReviewed(_id: string, language: string) {
    const savedFile = await files.save({ _id, generatedToc: false });
    const sameEntityFiles = await files.get({ entity: savedFile.entity }, { generatedToc: 1 });
    const [entity] = await entities.get({
      sharedId: savedFile.entity,
    });

    await entities.save(
      {
        _id: entity._id,
        sharedId: entity.sharedId,
        template: entity.template,
        generatedToc: sameEntityFiles.reduce<boolean>(
          (generated, file) => generated || Boolean(file.generatedToc),
          false
        ),
      },
      { user: {}, language }
    );

    return savedFile;
  },
};
