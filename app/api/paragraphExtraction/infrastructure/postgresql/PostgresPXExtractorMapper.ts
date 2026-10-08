import { Template } from '#api/core/domain/template/Template.js';
import { PXExtractor } from '../../domain/PXExtractor.js';
import { PXExtractorRow } from './PXExtractorRow.js';

export class PostgresPXExtractorMapper {
  static toRow(extractor: PXExtractor): PXExtractorRow {
    return {
      _id: extractor.id,
      sourceTemplateId: extractor.sourceTemplate.id,
      targetTemplateId: extractor.targetTemplate.id,
      paragraphNumberPropertyId: extractor.paragraphNumberProperty.id,
      paragraphPropertyId: extractor.paragraphProperty.id,
      sourceRelationshipTypeId: extractor.sourceRelationshipTypeId,
      targetRelationshipTypeId: extractor.targetRelationshipTypeId,
    };
  }

  static toDomain(
    row: PXExtractorRow,
    sourceTemplate: Template,
    targetTemplate: Template
  ): PXExtractor {
    return new PXExtractor({
      id: row._id,
      sourceTemplate,
      targetTemplate,
      paragraphNumberPropertyId: row.paragraphNumberPropertyId,
      paragraphPropertyId: row.paragraphPropertyId,
      sourceRelationshipTypeId: row.sourceRelationshipTypeId,
      targetRelationshipTypeId: row.targetRelationshipTypeId,
    });
  }
}
