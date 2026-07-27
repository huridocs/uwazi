import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteRelationshipTypeUseCaseFactory } from '../../infrastructure/factories/DeleteRelationshipTypeUseCaseFactory.js';

const factory = getFixturesFactory();

const fixtures = {
  relationtypes: [
    { _id: factory.id('deletable'), name: 'Deletable', properties: [] },
    { _id: factory.id('inConnections'), name: 'In Connections', properties: [] },
    { _id: factory.id('inTemplateProp'), name: 'In Template Prop', properties: [] },
  ],
  templates: [
    factory.template('Template using relation type', [
      factory.relationshipProp('rel prop', 'some template', {
        relationType: factory.id('inTemplateProp').toHexString(),
      }),
    ]),
  ],
  connections: [
    {
      _id: factory.id('connection1'),
      title: 'used relation type',
      sourceDocument: 'source1',
      template: factory.id('inConnections'),
    },
  ],
};

describe('DeleteRelationshipTypeUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete relationship type when not used', async () => {
    const result = await testingEnvironment.runWithContext(async () =>
      DeleteRelationshipTypeUseCaseFactory.default().execute({
        id: factory.id('deletable').toHexString(),
      })
    );

    expect(result).toBe(true);
    const relationtypes = await testingEnvironment.db.getAllFrom('relationtypes');
    expect(relationtypes).not.toContainEqual(expect.objectContaining({ name: 'Deletable' }));
  });

  it('should return false when relation type is used in connections', async () => {
    const result = await testingEnvironment.runWithContext(async () =>
      DeleteRelationshipTypeUseCaseFactory.default().execute({
        id: factory.id('inConnections').toHexString(),
      })
    );

    expect(result).toBe(false);
  });

  it('should throw when relation type is used in template properties', async () => {
    await expect(
      testingEnvironment.runWithContext(async () =>
        DeleteRelationshipTypeUseCaseFactory.default().execute({
          id: factory.id('inTemplateProp').toHexString(),
        })
      )
    ).rejects.toMatchObject({
      message: expect.stringContaining('Cannot delete type being used in templates'),
    });
  });
});
