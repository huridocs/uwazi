/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';

import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { mongoPXEntitiesStatusCollection } from '../../../infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from '../../../infrastructure/MongoPXEntityStatusDBO';

const f = getFixturesFactory();

const sourceTemplate1 = f.template('Source Template');
const sourceTemplate2 = f.template('Source Template 2');
const sourceTemplate3 = f.template('Source Template 3');

const paragraphProperty = f.property('rich_text', 'markdown');
const paragraphNumberProperty = f.property('paragraph_number_property', 'numeric');
const targetTemplate1 = f.template('Target Template', [paragraphProperty, paragraphNumberProperty]);

const templateWithoutExtractor = f.template('Template');

const sourceRelationshipType = {
  _id: new ObjectId(),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: new ObjectId(),
  name: 'Target Relationship Type',
  properties: [],
};

const extractor1: MongoPXExtractorDBO = {
  _id: f.id('extractor'),
  sourceTemplateId: sourceTemplate1._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const extractor2: MongoPXExtractorDBO = {
  _id: f.id('extractor2'),
  sourceTemplateId: sourceTemplate2._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const extractorWithoutEntities: MongoPXExtractorDBO = {
  _id: f.id('extractor3'),
  sourceTemplateId: sourceTemplate3._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const lang = ['en', 'pt'];

const [entity1En, entity1Pt] = f.entityInMultipleLanguages(lang, 'entity1', sourceTemplate1.name);
const [entity2En, entity2Pt] = f.entityInMultipleLanguages(lang, 'entity2', sourceTemplate1.name);
const [entity3En, entity3Pt] = f.entityInMultipleLanguages(lang, 'entity3', sourceTemplate2.name);
const [entity4En, entity4Pt] = f.entityInMultipleLanguages(lang, 'entity4', sourceTemplate1.name);
const [entity5En, entity5Pt] = f.entityInMultipleLanguages(lang, 'entity5', sourceTemplate1.name);
const [entity6En, entity6Pt] = f.entityInMultipleLanguages(lang, 'entity6', sourceTemplate1.name);
const [entity7En, entity7Pt] = f.entityInMultipleLanguages(lang, 'entity7', sourceTemplate1.name);
const [entity8En, entity8Pt] = f.entityInMultipleLanguages(lang, 'entity8', sourceTemplate1.name);
const [entity9En, entity9Pt] = f.entityInMultipleLanguages(lang, 'entity9', sourceTemplate1.name);
const [entity10En, entity10Pt] = f.entityInMultipleLanguages(
  lang,
  'entity10',
  sourceTemplate1.name
);
const [entityWithoutExtractorEn] = f.entityInMultipleLanguages(
  lang,
  'entityWithoutExtractor',
  templateWithoutExtractor.name
);

const fileEntity1En = f.processedDocument('fileEntity1En', {
  language: 'en',
  entity: entity1En.sharedId,
});
const secondFileEntity1En = f.processedDocument('secondFileEntity1En', {
  language: 'en',
  entity: entity1En.sharedId,
});
const fileEntity1Pt = f.processedDocument('fileEntity1Pt', {
  language: 'pt',
  entity: entity1En.sharedId,
});
const fileEntity1It = f.processedDocument('fileEntity1It', {
  language: 'it',
  entity: entity1En.sharedId,
});
const fileEntity2It = f.processedDocument('fileEntity2En', {
  language: 'it',
  entity: entity2En.sharedId,
});
const fileEntity4En = f.processedDocument('fileEntity4En', {
  language: 'en',
  entity: entity5En.sharedId,
});

const [paragraph1Entity1En, paragraph1Entity1Pt] = f.entityInMultipleLanguages(
  lang,
  'paragraph1En1',
  targetTemplate1.name,
  {},
  {},
  {
    en: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 1 EN, number 2' }],
        [paragraphNumberProperty.name]: [{ value: 2 }],
      },
    },
    pt: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 1 PT, number 2' }],
        [paragraphNumberProperty.name]: [{ value: 2 }],
      },
    },
  }
);
const [paragraph2Entity1En, paragraph2Entity1Pt] = f.entityInMultipleLanguages(
  lang,
  'paragraph2En1',
  targetTemplate1.name,
  {},
  {},
  {
    en: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 2 EN, number 1' }],
        [paragraphNumberProperty.name]: [{ value: 1 }],
      },
    },
    pt: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 2 PT, number 1' }],
        [paragraphNumberProperty.name]: [{ value: 1 }],
      },
    },
  }
);
const [paragraph3Entity1En, paragraph3Entity1Pt] = f.entityInMultipleLanguages(
  lang,
  'paragraph3En1',
  targetTemplate1.name,
  {},
  {},
  {
    en: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 3 EN, number 3' }],
        [paragraphNumberProperty.name]: [{ value: 3 }],
      },
    },
    pt: {
      metadata: {
        [paragraphProperty.name]: [{ value: 'Entity 1 Paragraph 3 PT, number 3' }],
        [paragraphNumberProperty.name]: [{ value: 3 }],
      },
    },
  }
);
const [paragraph1Entity5En, paragraph1Entity5Pt] = f.entityInMultipleLanguages(
  lang,
  'paragraph1En5',
  targetTemplate1.name
);

const relationshipE1Hub1 = {
  _id: f.id('relationshipE1Hub1'),
  entity: entity1En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

const relationshipP1Hub1 = {
  _id: f.id('relationshipP1Hub1'),
  entity: paragraph1Entity1En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const relationshipP2Hub1 = {
  _id: f.id('relationshipP2Hub1'),
  entity: paragraph2Entity1En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const relationshipNotParagraphHub1 = {
  _id: f.id('relationshipNotParagraphHub1'),
  entity: entityWithoutExtractorEn.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const relationshipE1Hub2 = {
  _id: f.id('relationshipE1Hub2'),
  entity: entity1En.sharedId,
  hub: f.id('hub2'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

const relationshipP3Hub2 = {
  _id: f.id('relationshipP3Hub2'),
  entity: paragraph3Entity1En.sharedId,
  hub: f.id('hub2'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const relationshipE5Hub3 = {
  _id: f.id('relationshipE5Hub3'),
  entity: entity5En.sharedId,
  hub: f.id('hub3'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

const relationshipP1Hub3 = {
  _id: f.id('relationshipP1Hub3'),
  entity: paragraph3Entity1En.sharedId,
  hub: f.id('hub3'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const pxEntityStatus1: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus1'),
  entitySharedId: entity1En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Processed,
};

const pxEntityStatus2: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus2'),
  entitySharedId: entity2En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const pxEntityStatus3: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus3'),
  entitySharedId: entity3En.sharedId!,
  extractorId: extractor2._id,
  status: EntityStatus.New,
};

const pxEntityStatus4: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus4'),
  entitySharedId: entity4En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const pxEntityStatus5: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus5'),
  entitySharedId: entity5En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Processing,
};

const pxEntityStatus6: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus6'),
  entitySharedId: entity6En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Obsolete,
};

const pxEntityStatus7: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus7'),
  entitySharedId: entity7En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Obsolete,
};

const pxEntityStatus8: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus8'),
  entitySharedId: entity8En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Error,
};

const pxEntityStatus9: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus9'),
  entitySharedId: entity9En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const pxEntityStatus10: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus10'),
  entitySharedId: entity10En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.ProcessingObsolete,
};

const entityFixtures = {
  entity1En,
  entity1Pt,
  entity2En,
  entity2Pt,
  entity3En,
  entity3Pt,
  entity4En,
  entity4Pt,
  entity5En,
  entity5Pt,
  entity6En,
  entity6Pt,
  entity7En,
  entity7Pt,
  entity8En,
  entity8Pt,
  entity9En,
  entity9Pt,
  entityWithoutExtractorEn,
  paragraph1Entity1En,
  paragraph1Entity1Pt,
  paragraph2Entity1En,
  paragraph2Entity1Pt,
  paragraph3Entity1En,
  paragraph3Entity1Pt,
  paragraph1Entity5En,
  paragraph1Entity5Pt,
};

const entityStatusFixtures = {
  pxEntityStatus1,
  pxEntityStatus2,
  pxEntityStatus3,
  pxEntityStatus4,
  pxEntityStatus5,
  pxEntityStatus6,
  pxEntityStatus7,
  pxEntityStatus8,
  pxEntityStatus9,
};

const relationshipFixtures = {
  relationshipE1Hub1,
  relationshipP1Hub1,
  relationshipP2Hub1,
  relationshipNotParagraphHub1,
  relationshipE1Hub2,
  relationshipP3Hub2,
  relationshipE5Hub3,
  relationshipP1Hub3,
};

const fixtures = {
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  [mongoPXExtractorsCollection]: [extractor1, extractor2, extractorWithoutEntities],
  [mongoPXEntitiesStatusCollection]: Object.values(entityStatusFixtures).map(value => value),
  templates: [sourceTemplate1, sourceTemplate2, targetTemplate1],
  entities: Object.values(entityFixtures).map(value => value),
  files: [
    fileEntity1En,
    secondFileEntity1En,
    fileEntity1Pt,
    fileEntity1It,
    fileEntity2It,
    fileEntity4En,
  ],
  connections: Object.values(relationshipFixtures).map(value => value),
  settings: [
    {
      languages: [
        { label: 'English', key: 'en' as LanguageISO6391, default: true },
        { label: 'Portuguese', key: 'pt' as LanguageISO6391 },
      ],
    },
  ],
};

export {
  fixtures as extractorsQueryFixtures,
  entityFixtures,
  entity10En,
  entity10Pt,
  entityStatusFixtures,
  pxEntityStatus10,
  relationshipFixtures,
  extractor1,
  extractor2,
  extractorWithoutEntities,
  sourceTemplate1,
  sourceTemplate2,
  sourceTemplate3,
  targetTemplate1,
  paragraphProperty,
  paragraphNumberProperty,
};
