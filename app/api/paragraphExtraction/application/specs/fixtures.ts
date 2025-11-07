import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
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

export const entity1 = factory.entity('entity', sourceTemplate.name);
export const entity2 = factory.entity('entity2', sourceTemplate.name);
export const entity3 = factory.entity('entity_with_same_target_template', targetTemplate.name);

export const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

export const entityStatus1: MongoPXEntityStatusDBO = {
  _id: factory.id('entityStatus'),
  entitySharedId: entity1.sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.Processing,
};

export const entityStatus2: MongoPXEntityStatusDBO = {
  _id: factory.id('entityStatus2'),
  entitySharedId: entity2.sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.Processing,
};

export const file = factory.document('file', {
  language: 'en',
  entity: entity1.sharedId,
  status: 'ready',
});

export const file2 = factory.document('file2', {
  language: 'es',
  entity: entity1.sharedId,
  status: 'ready',
});

export const file3 = factory.document('file3', { language: 'es', entity: entity2.sharedId });
export const fileWithLanguageNotInstalled = factory.document('fileWithLanguageNotInstalled', {
  language: 'pt',
  entity: entity1.sharedId,
  status: 'ready',
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

export const files = [factory.file('file1.txt'), factory.file('file2.txt')];

export const paragraph1 = factory.entity('paragraph1', targetTemplate.name);
export const paragraph2 = factory.entity('paragraph2', targetTemplate.name);
export const paragraph3 = factory.entity('paragraph3', targetTemplate.name);

export const paragraph4 = factory.entity('paragraph4', targetTemplate.name);
export const paragraph5 = factory.entity('paragraph5', targetTemplate.name);

export const relationshipE1Hub1 = {
  _id: factory.id('relationshipE1Hub1'),
  entity: entity1.sharedId,
  hub: factory.id('E1Hub1'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

export const relationshipP1Hub1 = {
  _id: factory.id('relationshipP1Hub1'),
  entity: paragraph1.sharedId,
  hub: factory.id('E1Hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const relationshipP1Hub1Repeated = {
  _id: factory.id('relationshipP1Hub1Repeated'),
  entity: paragraph1.sharedId,
  hub: factory.id('E1Hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const relationshipP2Hub1 = {
  _id: factory.id('relationshipP2Hub1'),
  entity: paragraph2.sharedId,
  hub: factory.id('E1Hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const relationshipE1Hub3 = {
  _id: factory.id('relationshipE1Hub3'),
  entity: entity1.sharedId,
  hub: factory.id('E1Hub3'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

export const relationshipP3Hub3 = {
  _id: factory.id('relationshipP3Hub3'),
  entity: paragraph3.sharedId,
  hub: factory.id('E1Hub3'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const relationshipE2Hub1 = {
  _id: factory.id('relationshipE2Hub1'),
  entity: entity2.sharedId,
  hub: factory.id('E2Hub1'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

export const relationshipP4Hub1 = {
  _id: factory.id('relationshipP4Hub1'),
  entity: paragraph4.sharedId,
  hub: factory.id('E2Hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const relationshipE2Hub2 = {
  _id: factory.id('relationshipE2Hub2'),
  entity: entity2.sharedId,
  hub: factory.id('E2Hub2'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

export const relationshipP5Hub2 = {
  _id: factory.id('relationshipP5Hub2'),
  entity: paragraph5.sharedId,
  hub: factory.id('E2Hub2'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

export const userId = new ObjectId();
