import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { CreateTemplateService } from '../CreateTemplateService';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  templates: [
    fixturesFactory.template('template1', [fixturesFactory.property('text1', 'text')]),
    fixturesFactory.template('template2', [fixturesFactory.property('text1', 'text')]),
    fixturesFactory.template('template3', [fixturesFactory.property('number1', 'numeric')]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

function setUpService() {
  const transactionManager = new MongoTransactionManager(getClient());
  const templatesDS = new MongoTemplatesDataSource(getConnection(), transactionManager);
  return new CreateTemplateService(templatesDS);
}

describe('when validating the query', () => {
  it('should check that all the templates of the entities matched have the denormalized property', async () => {
    const service = setUpService();

    try {
      await service.createRelationshipProperty({
        name: 'new_relationship',
        type: 'newRelationship',
        label: 'new relationshp',
        query: [
          {
            direction: 'out',
            types: [],
            match: [
              {
                templates: [fixturesFactory.id('template1').toHexString()],
              },
            ],
          },
          {
            direction: 'in',
            types: [],
            match: [
              {
                templates: [fixturesFactory.id('template3').toHexString()],
              },
            ],
          },
        ],
        denormalizedProperty: 'text1',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
    }
  });

  it('should pass if all the templates of the entities matched have the denormalized property', async () => {
    const service = setUpService();
    await service.createRelationshipProperty({
      name: 'new_relationship',
      type: 'newRelationship',
      label: 'new relationshp',
      query: [
        {
          direction: 'out',
          types: [],
          match: [
            {
              templates: [fixturesFactory.id('template1').toHexString()],
            },
          ],
        },
        {
          direction: 'in',
          types: [],
          match: [
            {
              templates: [fixturesFactory.id('template2').toHexString()],
            },
          ],
        },
      ],
      denormalizedProperty: 'text1',
    });
  });

  it.todo('should consider filters matching all templates');
});
