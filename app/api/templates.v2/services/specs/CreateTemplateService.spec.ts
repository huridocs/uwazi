import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { CreateTemplateService } from '../CreateTemplateService';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  relationtypes: [fixturesFactory.relationType('relation')],
  templates: [
    fixturesFactory.template('template1', [
      fixturesFactory.property('text1', 'text'),
      fixturesFactory.property('text2', 'text'),
    ]),
    fixturesFactory.template('template2', [
      fixturesFactory.property('text1', 'text'),
      fixturesFactory.property('text2', 'text'),
    ]),
    fixturesFactory.template('template3', [
      fixturesFactory.property('number1', 'numeric'),
      fixturesFactory.property('text2', 'text'),
    ]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

function setUpService() {
  const connection = getConnection();
  const transactionManager = new MongoTransactionManager(getClient());
  const templatesDS = new MongoTemplatesDataSource(connection, transactionManager);
  const relTypeDS = new MongoRelationshipTypesDataSource(connection, transactionManager);
  const relationshipsDS = new MongoRelationshipsDataSource(connection, transactionManager);
  const settingsDS = new MongoSettingsDataSource(connection, transactionManager);
  const entityDS = new MongoEntitiesDataSource(
    connection,
    templatesDS,
    relationshipsDS,
    settingsDS,
    transactionManager
  );
  return new CreateTemplateService(templatesDS, relTypeDS, entityDS);
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
      throw new Error('should have thrown an error');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      if (e instanceof ValidationError) {
        expect(e.errors[0].path).toBe('/query/1/0/templates');
      }
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

  it('should consider filters matching all templates', async () => {
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
              templates: [],
            },
          ],
        },
      ],
      denormalizedProperty: 'text2',
    });
  });

  it('should check that templates exist', async () => {
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
                templates: [fixturesFactory.id('non-existing-template').toHexString()],
              },
            ],
          },
        ],
        denormalizedProperty: 'text1',
      });
      throw new Error('should have thrown an error');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      if (e instanceof ValidationError) {
        expect(e.errors[0].path).toBe('/query/0/0/templates');
        expect(e.errors[0].message).toBe(
          `Templates ${fixturesFactory.id('non-existing-template').toHexString()} do not exist.`
        );
      }
    }
  });

  it('should check that reltypes exist', async () => {
    const service = setUpService();

    try {
      await service.createRelationshipProperty({
        name: 'new_relationship',
        type: 'newRelationship',
        label: 'new relationshp',
        query: [
          {
            direction: 'out',
            types: [fixturesFactory.id('non-existing-reltype').toHexString()],
            match: [
              {
                templates: [fixturesFactory.id('template1').toHexString()],
              },
            ],
          },
        ],
        denormalizedProperty: 'text1',
      });
      throw new Error('should have thrown an error');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      if (e instanceof ValidationError) {
        expect(e.errors[0].path).toBe('/query/0/types');
        expect(e.errors[0].message).toBe(
          `Relation types ${fixturesFactory.id('non-existing-reltype').toHexString()} do not exist.`
        );
      }
    }
  });
});
