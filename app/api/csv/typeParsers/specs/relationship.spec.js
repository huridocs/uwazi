import entities, { model } from 'api/entities';
import { search } from 'api/search';
import db from 'api/utils/testing_db';

import { fixtures, templateToRelateId } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

const rawEntityWithRelationshipValue = (val, language, propname = 'relationship_prop') => ({
  propertiesFromColumns: {
    [propname]: val,
  },
  language,
});

describe('relationship', () => {
  let value1;
  let value2;
  let value3;
  let entitiesRelated;

  const templateProp = {
    name: 'relationship_prop',
    content: templateToRelateId,
  };

  const noContentTemplateProp = {
    name: 'relationship_no_content',
  };

  const prepareExtraFixtures = async () => {
    await model.save({
      title: 'value1',
      template: templateToRelateId,
      sharedId: '123',
      language: 'en',
    });
    await model.save({
      title: 'value1',
      template: templateToRelateId,
      sharedId: '123',
      language: 'es',
    });
    await model.save({
      title: 'value1',
      template: db.id(),
      sharedId: 'not the same sharedId',
      language: 'pt',
    });
  };

  const runScenarios = async () => {
    value1 = await typeParsers.relationship(
      rawEntityWithRelationshipValue('value1|value3|value3', 'en'),
      templateProp
    );

    value2 = await typeParsers.relationship(
      rawEntityWithRelationshipValue('value1|value2', 'en'),
      templateProp
    );
    value3 = await typeParsers.relationship(
      rawEntityWithRelationshipValue('value1|value2', 'en'),
      templateProp
    );

    await typeParsers.relationship(rawEntityWithRelationshipValue(''), templateProp);
    await typeParsers.relationship(rawEntityWithRelationshipValue('|'), templateProp);
    await typeParsers.relationship(
      rawEntityWithRelationshipValue('newValue', undefined, 'relationship_no_content'),
      noContentTemplateProp
    );
  };

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);

    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await prepareExtraFixtures();
    await runScenarios();

    entitiesRelated = await entities.get({ template: templateToRelateId, language: 'en' });
  });

  afterAll(async () => db.disconnect());

  it('should create entities and return the ids', async () => {
    expect(entitiesRelated[0].title).toBe('value1');
    expect(entitiesRelated[1].title).toBe('value3');
    expect(entitiesRelated[2].title).toBe('value2');

    expect(value1).toEqual([
      { value: entitiesRelated[0].sharedId, label: 'value1' },
      { value: entitiesRelated[1].sharedId, label: 'value3' },
    ]);
    expect(value2).toEqual([
      { value: entitiesRelated[0].sharedId, label: 'value1' },
      { value: entitiesRelated[2].sharedId, label: 'value2' },
    ]);
    expect(value3).toEqual([
      { value: entitiesRelated[0].sharedId, label: 'value1' },
      { value: entitiesRelated[2].sharedId, label: 'value2' },
    ]);
  });

  it('should not create blank values, duplicate values, or values without templates', async () => {
    expect(entitiesRelated.length).toBe(3);
  });
});
