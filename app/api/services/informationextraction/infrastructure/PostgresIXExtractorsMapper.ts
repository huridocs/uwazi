import { ObjectId } from 'mongodb';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { Extractor } from '../domain/IXExtractorsDataSource.js';
import type { IXExtractorsRow } from './PostgresIXExtractorsRow.js';

/**
 * Translates between an `ix_extractors` row and the `Extractor` the port returns. The port still
 * speaks ObjectIds, mirroring what the Mongo implementation returns; the row holds hex strings.
 */
class PostgresIXExtractorsMapper {
  static toDomain(row: IXExtractorsRow): Extractor {
    return {
      _id: new ObjectId(row._id),
      name: row.name,
      property: row.property,
      source: row.source,
      templates: row.templates.map(templateId => new ObjectId(templateId)),
    };
  }

  static toRow(extractor: IXExtractorType): IXExtractorsRow {
    return {
      _id: extractor._id.toString(),
      name: extractor.name,
      property: extractor.property,
      source: extractor.source,
      templates: extractor.templates.map(templateId => templateId.toString()),
    };
  }
}

export { PostgresIXExtractorsMapper };
