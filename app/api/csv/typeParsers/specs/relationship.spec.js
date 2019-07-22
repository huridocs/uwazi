import entities, { model } from 'api/entities';
import db from 'api/utils/testing_db';

import fixtures, { templateToRelateId } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

describe('relationship', () => {
  let value1;
  let value2;
  let value3;
  let entitiesRelated;

  const templateProp = {
    name: 'relationship_prop',
    content: templateToRelateId
  };

  afterAll(async () => db.disconnect());

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);

    spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
    await model.save({ title: 'value1', template: templateToRelateId, sharedId: '123', language: 'en' });
    await model.save({ title: 'value1', template: templateToRelateId, sharedId: '123', language: 'es' });
    value1 = await typeParsers.relationship(
      { relationship_prop: 'value1|value3|value3' },
      templateProp
    );

    value2 = await typeParsers.relationship(
      { relationship_prop: 'value1|value2' },
      templateProp
    );

    value3 = await typeParsers.relationship(
      { relationship_prop: 'value1|value2' },
      templateProp
    );

    await typeParsers.relationship(
      { relationship_prop: '' },
      templateProp
    );

    await typeParsers.relationship(
      { relationship_prop: '|' },
      templateProp
    );

    entitiesRelated = await entities.get({ template: templateToRelateId, language: 'en' });
  });

  it('should create entities and return the ids', async () => {
    expect(entitiesRelated[0].title).toBe('value1');
    expect(entitiesRelated[1].title).toBe('value3');
    expect(entitiesRelated[2].title).toBe('value2');

    expect(value1).toEqual([entitiesRelated[0].sharedId, entitiesRelated[1].sharedId]);
    expect(value2).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
    expect(value3).toEqual([entitiesRelated[0].sharedId, entitiesRelated[2].sharedId]);
  });

  it('should not create blank values or duplicate values', async () => {
    expect(entitiesRelated.length).toBe(3);
  });
});
