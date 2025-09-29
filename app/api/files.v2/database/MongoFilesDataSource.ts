import { ObjectId } from 'mongodb';

import { LanguageUtils } from 'shared/language';
import { SegmentationType } from 'shared/types/segmentationType';

import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { ResultSet } from 'api/common.v2/contracts/ResultSet';

import { FilesDataSource, GetDocumentsForEntityOptions } from '../contracts/FilesDataSource';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';

import { FileMappers } from './FilesMappers';
import { FileDBOType } from './schemas/filesTypes';
import { SegmentationMapper } from './SegmentationMapper';

type GetDocumentsForEntityQuery = {
  entity: string;
  type: 'document';
  language?: { $in: string[] };
};

export type SegmentationDBO = SegmentationType & {
  _id: ObjectId;
  fileID: ObjectId;
};

export class MongoFilesDataSource extends MongoDataSource<FileDBOType> implements FilesDataSource {
  protected collectionName = 'files';

  async deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]) {
    await this.getCollection().updateMany(
      { entity: { $in: entitySharedIds }, extractedMetadata: { $exists: true, $ne: [] } },
      { $pull: { extractedMetadata: { name: { $in: entityPropertyNames } } } }
    );
  }

  async renameExtractedMetadata(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ) {
    const branches = Object.entries(renamedPropertyNames).map(([oldVal, newVal]) => ({
      case: { $eq: ['$$item.name', oldVal] },
      then: newVal,
    }));

    const pipeline = [
      {
        $set: {
          extractedMetadata: {
            $map: {
              input: '$extractedMetadata',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    name: {
                      $switch: {
                        branches,
                        default: '$$item.name',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];
    await this.getCollection().updateMany(
      {
        'extractedMetadata.name': { $in: Object.keys(renamedPropertyNames) },
        entity: { $in: entitySharedIds },
      },
      pipeline
    );
  }

  getSegmentations(filesId: string[]): ResultSet<Segmentation> {
    const cursor = this.getCollection<SegmentationDBO>('segmentations').find({
      fileID: { $in: filesId.map(id => new ObjectId(id)) },
      status: 'ready',
      segmentation: { $exists: true },
    });

    return new MongoResultSet(cursor, SegmentationMapper.toDomain);
  }

  getDocumentsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<Document> {
    const query: GetDocumentsForEntityQuery = { entity: entitySharedId, type: 'document' };

    if (options?.languages) {
      const inLanguages = options.languages.reduce((langauges, l) => {
        const language = LanguageUtils.fromISO639_1(l)?.ISO639_3;
        if (language) {
          langauges.push(language);
        }
        return langauges;
      }, [] as string[]);

      if (inLanguages.length) {
        query.language = { $in: inLanguages };
      }
    }

    return new MongoResultSet<FileDBOType, Document>(
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      FileMappers.toDocumentModel
    );
  }

  getAll() {
    return new MongoResultSet<FileDBOType, UwaziFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      FileMappers.toModel
    );
  }

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
