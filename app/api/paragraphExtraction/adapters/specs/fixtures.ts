/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const f = getFixturesFactory();

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

const fileEntity1En = f.document('fileEntity1En', { language: 'en', entity: entity1En.sharedId });
const fileEntity1Pt = f.document('fileEntity1Pt', { language: 'pt', entity: entity1En.sharedId });
const fileEntity2En = f.document('fileEntity2En', { language: 'en', entity: entity2En.sharedId });

const templateFixtures = {
  sourceTemplate,
  targetTemplate,
};

const entityFixtures = {
  entity1En,
  entity1Pt,
  entity2En,
  entity2Pt,
};

const relationshipFixtures = {
  sourceRelationshipType,
  targetRelationshipType,
};

const fixtures = {
  templates: Object.values(templateFixtures).map(value => value),
  entities: Object.values(entityFixtures).map(value => value),
  files: [fileEntity1En, fileEntity1Pt, fileEntity2En],
  relationtypes: Object.values(relationshipFixtures).map(value => value),
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
  fixtures,
  templateFixtures,
  entityFixtures,
  relationshipFixtures,
  paragraphProperty,
  paragraphNumberProperty,
};
