import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('thesauri_translations_in_entity_metadata', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(58);
  });

  it('should update entities metadata with translated thesauri values', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find({}).toArray();
    expect(entities).toMatchObject([
      {
        title: 'Entity 1',
        language: 'en',
        metadata: {
          multi_select: [
            {
              value: 'km5ew66zj2',
              label: 'This value was translated in english to change the way it displays',
            },
            {
              value: 'qhezokoxwgl',
              label: 'English value two',
            },
          ],
          text: [{ value: 'some text value' }],
        },
      },
      {
        title: 'Entity 1',
        language: 'es',
        metadata: {
          multi_select: [
            { value: 'km5ew66zj2', label: 'Valor uno en español' },
            {
              value: 'qhezokoxwgl',
              label: 'Valor dos en español',
            },
          ],
          text: [{ value: 'un valor de texto' }],
        },
      },
      {
        title: 'Entity 2',
        language: 'en',
        metadata: {
          select: [{ value: 's9emfh4f2sn', label: 'Value that is not translated' }],
        },
      },
      {
        title: 'Entity 2',
        language: 'es',
        metadata: {
          select: [{ value: 's9emfh4f2sn', label: 'Value that is not translated' }],
        },
      },
      {
        title: 'Entity 3',
        language: 'en',
        metadata: {
          multi_select: [{ value: 'qhezokoxwgl', label: 'English value two' }],
          text: [{ value: 'another text value' }],
        },
      },
      {
        title: 'Entity 3',
        language: 'es',
        metadata: {
          multi_select: [{ value: 'qhezokoxwgl', label: 'Valor dos en español' }],
          text: [{ value: 'más texto' }],
        },
      },
      {
        title: 'Entity 4',
        language: 'en',
        metadata: { text: [{ value: 'this entity only has text values' }], multi_select: [] },
      },
      {
        title: 'Entity 4',
        language: 'es',
        metadata: { text: [{ value: 'esta entidad solo tiene un texto' }], multi_select: [] },
      },
      {
        title: 'Entity 5',
        language: 'en',
        metadata: {
          select: [
            {
              value: 'oxd117w0bf',
              label: 'Nested item 1',
              parent: {
                value: 'x5q2yo64gmk',
                label: 'Nested',
              },
            },
          ],
        },
      },
      {
        title: 'Entity 5',
        language: 'es',
        metadata: {
          select: [
            {
              value: 'oxd117w0bf',
              label: 'Item agrupado 1',
              parent: {
                value: 'x5q2yo64gmk',
                label: 'Agrupados',
              },
            },
          ],
        },
      },
    ]);
  });
});
