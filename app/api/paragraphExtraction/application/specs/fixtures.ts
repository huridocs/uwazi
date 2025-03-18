import { FileBuilder } from 'api/files.v2/model/specs/utils/FileBuilder';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoPXEntityStatus } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatus';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { ObjectId } from 'mongodb';

const factory = getFixturesFactory();

const paragraphProperty = factory.property('rich_text', 'markdown');
const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric');

const sourceRelationshipType = {
  _id: factory.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: factory.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

export const defaultTemplate = factory.template('Default Template');
export const sourceTemplate = factory.template('Source Template', [
  factory.property('text', 'text'),
]);
export const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
]);

export const invalidEntity = factory.entity('invalidEntity', defaultTemplate.name);

export const entity = factory.entity('entity', sourceTemplate.name);
export const entity2 = factory.entity('entity2', sourceTemplate.name);

export const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

export const entityStatus: MongoPXEntityStatus = {
  _id: factory.id('entityStatus'),
  entitySharedId: entity.sharedId!,
  extractorId: extractor._id,
  failedParagraphsCount: 0,
  paragraphsCount: 0,
  successfulParagraphsCount: 0,
  status: EntityStatus.Queued,
};

export const file = factory.document('file', { language: 'eng', entity: entity.sharedId });
export const file2 = factory.document('file2', { language: 'spa', entity: entity.sharedId });
export const file3 = factory.document('file3', { language: 'spa', entity: entity2.sharedId });
export const fileWithLanguageNotInstalled = factory.document('fileWithLanguageNotInstalled', {
  language: 'por',
  entity: entity.sharedId,
});

export const segmentation = factory.MongoSegmentationBuilder.create().withFileId(file._id).build();

export const segmentation2 = factory.MongoSegmentationBuilder.create()
  .withFileId(file2._id)
  .build();

export const segmentation3 = factory.MongoSegmentationBuilder.create()
  .withFileId(file3._id)
  .build();

export const segmentationFileWithLanguageNotInstalled = factory.MongoSegmentationBuilder.create()
  .withFileId(fileWithLanguageNotInstalled._id)
  .build();

export const failedSegmentation = factory.MongoSegmentationBuilder.create()
  .withFileId(file._id)
  .withStatus('failed')
  .build();

export const processingSegmentation = factory.MongoSegmentationBuilder.create()
  .withFileId(file._id)
  .withStatus('processing')
  .build();

export const files = [
  FileBuilder.create().withFilename('file1.txt').build(),
  FileBuilder.create().withFilename('file2.txt').build(),
];

export const userId = new ObjectId();
