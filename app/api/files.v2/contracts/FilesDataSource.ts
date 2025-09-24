
import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';

type GetDocumentsForEntityOptions = {
  languages?: LanguageISO6391[];
};

interface FilesDataSource {
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
  getAll(): ResultSet<UwaziFile>;
  getSegmentations(fileId: string[]): ResultSet<Segmentation>;
  getDocumentsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<Document>;
}
export type { FilesDataSource, GetDocumentsForEntityOptions };
