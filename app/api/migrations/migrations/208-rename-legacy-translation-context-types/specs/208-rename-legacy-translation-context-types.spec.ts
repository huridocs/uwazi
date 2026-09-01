import { Db } from 'mongodb';
import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures, ids, templateId, thesaurusId } from './fixtures.js';

let db: Db | null;

const CONTEXT_TYPES = ['Entity', 'Relationship Type', 'Uwazi UI', 'Thesaurus'] as const;

const applyPost207Validator = async () => {
  await db!.command({
    collMod: 'translationsV2',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['language', 'key', 'value', 'context'],
        properties: {
          context: {
            bsonType: 'object',
            required: ['id', 'type', 'label'],
            properties: {
              id: { bsonType: 'string', minLength: 1 },
              type: { enum: [...CONTEXT_TYPES] },
              label: { bsonType: 'string', minLength: 1 },
            },
          },
        },
      },
    },
    validationLevel: 'strict',
    validationAction: 'error',
  });
};

const clearContextValidator = async () => {
  await db!.command({
    collMod: 'translationsV2',
    validator: {},
    validationLevel: 'off',
  });
};

const typeCounts = async () => {
  const rows = await db!
    .collection('translationsV2')
    .aggregate<{ _id: string; n: number }>([{ $group: { _id: '$context.type', n: { $sum: 1 } } }])
    .toArray();

  return Object.fromEntries(rows.map(row => [row._id, row.n]));
};

const seed = async () => {
  await clearContextValidator();
  await db!.collection('translationsV2').deleteMany({});
  await db!.collection('translationsV2').insertMany(fixtures.translationsV2);
  await applyPost207Validator();
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
  await seed();
  await migration.up(db);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('208-rename-legacy-translation-context-types', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(208);
    expect(migration.reindex).toBe(false);
    expect(migration.requiresSchema).toBe(15);
  });

  it('should rename Document contexts to Entity', async () => {
    const leftover = await db!
      .collection('translationsV2')
      .find({ 'context.type': 'Document' })
      .toArray();
    expect(leftover).toEqual([]);

    const renamed = await db!
      .collection('translationsV2')
      .find({ _id: { $in: [ids.documentEn, ids.documentEs] } })
      .toArray();

    expect(renamed).toHaveLength(2);
    renamed.forEach(row => {
      expect(row.context).toEqual({
        id: templateId,
        type: 'Entity',
        label: 'Resolución de Presidencia de la CorteIDH',
      });
    });
    expect(renamed.map(row => row.value).sort()).toEqual(['Date', 'Fecha']);
  });

  it('should rename Dictionary contexts to Thesaurus', async () => {
    const leftover = await db!
      .collection('translationsV2')
      .find({ 'context.type': 'Dictionary' })
      .toArray();
    expect(leftover).toEqual([]);

    const renamed = await db!
      .collection('translationsV2')
      .find({ _id: { $in: [ids.dictionaryEn, ids.dictionaryPt] } })
      .toArray();

    expect(renamed).toHaveLength(2);
    renamed.forEach(row => {
      expect(row.context).toEqual({
        id: thesaurusId,
        type: 'Thesaurus',
        label: 'Countries',
      });
    });
    expect(renamed.map(row => row.value).sort()).toEqual(['Country', 'País']);
  });

  it('should not alter already-legal context types', async () => {
    const [entity, thesaurus, uwaziUi, relationshipType] = await Promise.all([
      db!.collection('translationsV2').findOne({ _id: ids.entityEn }),
      db!.collection('translationsV2').findOne({ _id: ids.thesaurusEn }),
      db!.collection('translationsV2').findOne({ _id: ids.uwaziUiEn }),
      db!.collection('translationsV2').findOne({ _id: ids.relationshipTypeEn }),
    ]);

    expect(entity?.context).toEqual({ id: 'already-entity', type: 'Entity', label: 'Case' });
    expect(thesaurus?.context).toEqual({
      id: 'already-thesaurus',
      type: 'Thesaurus',
      label: 'Status',
    });
    expect(uwaziUi?.context).toEqual({
      id: 'System',
      type: 'Uwazi UI',
      label: 'User Interface',
    });
    expect(relationshipType?.context).toEqual({
      id: 'rel-type',
      type: 'Relationship Type',
      label: 'Related to',
    });
  });

  it('should only leave the four legal context types', async () => {
    expect(await typeCounts()).toEqual({
      Entity: 3,
      Thesaurus: 3,
      'Uwazi UI': 1,
      'Relationship Type': 1,
    });
  });

  it('should be idempotent', async () => {
    await expect(migration.up(db!)).resolves.toBeUndefined();
    expect(await typeCounts()).toEqual({
      Entity: 3,
      Thesaurus: 3,
      'Uwazi UI': 1,
      'Relationship Type': 1,
    });
  });
});
