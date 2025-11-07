/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { UserRole } from 'shared/types/userSchema';

const f = getFixturesFactory();

const user = f.user('admin', UserRole.ADMIN);

const sourceTemplate = f.template('Source Template');

const paragraphProperty = f.property('rich_text', 'markdown');
const paragraphNumberProperty = f.property('paragraph_number_property', 'numeric');
const targetTemplate = f.template('Target Template', [paragraphProperty, paragraphNumberProperty]);

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

const langs = ['en', 'pt'];

const [entity1En, entity1Pt] = f.entityInMultipleLanguages(langs, 'entity1', sourceTemplate.name);
const [entity2En, entity2Pt] = f.entityInMultipleLanguages(langs, 'entity2', sourceTemplate.name);

const [paragraph1En, paragraph1Pt] = f.entityInMultipleLanguages(
  langs,
  'paragraph1',
  targetTemplate.name,
  {
    [paragraphNumberProperty.name]: [{ value: 2 }],
    [paragraphProperty.name]: [{ value: 'P1 (Position 2) Text' }],
  }
);
const [paragraph2En, paragraph2Pt] = f.entityInMultipleLanguages(
  langs,
  'paragraph2',
  targetTemplate.name,
  {
    [paragraphNumberProperty.name]: [{ value: 1 }],
    [paragraphProperty.name]: [{ value: 'P2 (Position 1) Text' }],
  }
);

const fileEntity1En = f.document('fileEntity1En', {
  language: 'en',
  entity: entity1En.sharedId,
  status: 'ready',
});
const fileEntity1Pt = f.document('fileEntity1Pt', {
  language: 'pt',
  entity: entity1En.sharedId,
  status: 'ready',
});
const fileEntity2En = f.document('fileEntity2En', {
  language: 'en',
  entity: entity2En.sharedId,
  status: 'ready',
});

const relationshipE1Hub1 = {
  _id: f.id('relationshipE1Hub1'),
  entity: entity1En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(sourceRelationshipType._id.toString()),
};

const relationshipP1Hub1 = {
  _id: f.id('relationshipP1Hub1'),
  entity: paragraph1En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const relationshipP2Hub1 = {
  _id: f.id('relationshipP2Hub1'),
  entity: paragraph2En.sharedId,
  hub: f.id('hub1'),
  template: ObjectId.createFromHexString(targetRelationshipType._id.toString()),
};

const templateFixtures = {
  sourceTemplate,
  targetTemplate,
};

const entityFixtures = {
  entity1En,
  entity1Pt,
  entity2En,
  entity2Pt,
  paragraph1En,
  paragraph1Pt,
  paragraph2En,
  paragraph2Pt,
};

const relationshipTypesFixtures = {
  sourceRelationshipType,
  targetRelationshipType,
};

const relationshipFixtures = {
  relationshipE1Hub1,
  relationshipP1Hub1,
  relationshipP2Hub1,
};

const fixtures = {
  templates: Object.values(templateFixtures).map(value => value),
  entities: Object.values(entityFixtures).map(value => value),
  files: [fileEntity1En, fileEntity1Pt, fileEntity2En],
  relationtypes: Object.values(relationshipTypesFixtures).map(value => value),
  connections: Object.values(relationshipFixtures).map(value => value),
  settings: [
    {
      languages: [
        { label: 'English', key: 'en' as LanguageISO6391, default: true },
        { label: 'Portuguese', key: 'pt' as LanguageISO6391 },
      ],
    },
  ],
  users: [user],
};

export {
  user,
  fixtures,
  templateFixtures,
  entityFixtures,
  relationshipTypesFixtures,
  relationshipFixtures,
  paragraphProperty,
  paragraphNumberProperty,
};
