import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';

const f = getFixturesFactory();

const sourceTemplate = f.template('Source Template', [f.property('text', 'text')]);
const targetTemplate = f.template('Target Template', [
  f.property('paragraphProperty', 'markdown'),
  f.property('paragraphNumberProperty', 'numeric'),
]);

const sourceRelationshipType = {
  _id: f.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: f.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const nonRelevantRelationshipType = {
  _id: f.id('nonRelevantRelationshipType'),
  name: 'Other Relationship Type',
  properties: [],
};

const extractorId = f.id('extractor1');
const extractor1 = {
  _id: extractorId,
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphPropertyId: targetTemplate.properties![0]._id,
  paragraphNumberPropertyId: targetTemplate.properties![1]._id,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const createBaseFixtures = (): DBFixture => ({
  templates: [sourceTemplate, targetTemplate],
  relationtypes: [sourceRelationshipType, targetRelationshipType, nonRelevantRelationshipType],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
  px_extractors: [extractor1],
  entities: [],
  files: [],
  connections: [],
});

export { f, createBaseFixtures, extractorId, sourceTemplate, targetTemplate };
