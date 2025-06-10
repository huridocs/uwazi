/* eslint-disable max-lines */
import entities from 'api/entities';
import entitiesModel from 'api/entities/entitiesModel';
import { search } from 'api/search';
import templates from 'api/templates';
import templatesModel from 'api/templates/templatesModel';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { instrumentObject, printPerformanceStats } from 'api/utils/instrumentPerformance';
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

const factory = getFixturesFactory();

const generateTemplate = () => ({
  name: 'Test Performance',
  commonProperties: [{ label: 'Title', type: 'text', name: 'title' }],
  properties: [
    { _id: testingDB.id(), label: 'Field 1', type: 'text', name: 'field1' },
    { _id: testingDB.id(), label: 'Field 2', type: 'text', name: 'field2' },
    { _id: testingDB.id(), label: 'Field 3', type: 'text', name: 'field3' },
    { _id: testingDB.id(), label: 'Field 4', type: 'text', name: 'field4' },
    { _id: testingDB.id(), label: 'Field 5', type: 'text', name: 'field5' },
  ],
});

const generateEntity = (template, num) => ({
  title: `Entity ${num}`,
  template: template._id,
  language: 'en',
  metadata: {
    field1: [{ value: `Value 1 for entity ${num}` }],
    field2: [{ value: `Value 2 for entity ${num}` }],
    field3: [{ value: `Value 3 for entity ${num}` }],
    field4: [{ value: `Value 4 for entity ${num}` }],
    field5: [{ value: `Value 5 for entity ${num}` }],
  },
});

const generateEntities = async (template, count) => {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(generateEntity(template, i));
  }
  return result;
};

describe('Templates save', () => {
  const template = generateTemplate();

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('text properties test', () => {
    it('should handle template update with 5k entities efficiently', async () => {
      await testingEnvironment.setUp({
        templates: [template],
        entities: generateEntities(template, 5000),
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      });
      // Instrument both templates and entities objects
      instrumentObject(templates, 'templates');
      instrumentObject(entities, 'entities');
      instrumentObject(templatesModel, 'templatesModel');
      instrumentObject(entitiesModel, 'entitiesModel');

      template.properties[0].label = 'new name';

      // Perform the operations
      await templates.save(template, 'en');
      // await entities.updateMetadataProperties(template, currentTemplate, 'en');

      console.info(printPerformanceStats());
    }, 999999);
  });

  describe('relationships property test', () => {
    fit('should handle template update with 5k entities efficiently', async () => {
      const template1 = factory.template('template1');
      const template2 = factory.template('template2', [
        factory.relationshipProp('rel1', 'template1'),
      ]);
      const hub1 = testingDB.id();

      const entitiesFixtures = [];
      const connections = [];
      for (let i = 0; i < 100; i += 1) {
        entitiesFixtures.push(factory.entity(`template1.entity${i}`, 'template1'));
        entitiesFixtures.push(
          factory.entity(`template2.entity${i}`, 'template2', {
            rel1: [factory.metadataValue(`template1.entity${i}`)],
          })
        );
        connections.push({
          _id: testingDB.id(),
          entity: `template1.entity${i}`,
          template: factory.idString('rel1'),
          hub: hub1,
        });
        connections.push({
          _id: testingDB.id(),
          entity: `template2.entity${i}`,
          hub: hub1,
        });
      }

      await testingEnvironment.setUp({
        templates: [template1, template2],
        relationtypes: [factory.relationType('rel1')],
        entities: entitiesFixtures,
        connections,
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      });

      // console.log(JSON.stringify(entitiesFixtures, null, ' '))

      // Instrument both templates and entities objects
      instrumentObject(templates, 'templates');
      // instrumentObject(entities, 'entities');
      instrumentObject(templatesModel, 'templatesModel');
      instrumentObject(entitiesModel, 'entitiesModel');
      instrumentObject(search, 'search');

      template2.properties[0].label = 'rel1 renamed';

      // Perform the operations
      console.time('Total:');
      await templates.save(template2, 'en');
      console.timeEnd('Total:');
      // await entities.updateMetadataProperties(template, currentTemplate, 'en');

      // console.info(printPerformanceStats());
    }, 999999);
  });
});
