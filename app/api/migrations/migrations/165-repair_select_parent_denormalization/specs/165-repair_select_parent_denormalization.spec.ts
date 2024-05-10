import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Fixture } from '../types';
import {
  oneLanguageFixtures,
  multiLanguageFixtures,
  correctFixtures,
  entities as entityFixtures,
} from './fixtures';

let db: Db | null;
let entities: any[] = [];

migration.batchSize = 2;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
  entities = await db!.collection('entities').find().toArray();
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

const getSuffix = (language?: string) => (language === 'en' || !language ? '' : `_${language}`);

const expectedSelect = (language?: string) => {
  const suffix = getSuffix(language);
  return [
    {
      value: 'B1_id',
      label: 'B1',
      parent: {
        value: 'B_id',
        label: `B${suffix}`,
      },
    },
  ];
};

const expectedSelect2 = (language?: string) => {
  const suffix = getSuffix(language);
  return [
    {
      value: 'child_id',
      label: 'child',
      parent: {
        value: 'group_id',
        label: `group${suffix}`,
      },
    },
  ];
};

const expectedMultiSelect = (language?: string) => {
  const suffix = getSuffix(language);
  return [
    {
      value: 'A2_id',
      label: 'A2',
      parent: {
        value: 'A_id',
        label: `A${suffix}`,
      },
    },
    {
      value: 'B3_id',
      label: 'B3',
      parent: {
        value: 'B_id',
        label: `B${suffix}`,
      },
    },
    {
      value: 'A3_id',
      label: 'A3',
      parent: {
        value: 'A_id',
        label: `A${suffix}`,
      },
    },
  ];
};

describe('migration repair_select_parent_denormalization', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(165);
  });

  describe('in general', () => {
    beforeAll(async () => {
      await initTest(oneLanguageFixtures);
    });

    it('should signal reindex', async () => {
      expect(migration.reindex).toBe(true);
    });

    it('should not change unrelated metadata', async () => {
      const unrelated = entities[0];
      expect(unrelated.metadata).toEqual({
        text: [
          {
            value: 'some_text',
            label: 'some_text',
          },
        ],
      });
    });

    it('should not change correct metadata', async () => {
      const correctEntities = entities.slice(1, 4);
      const correctMetadata = correctEntities.map(e => e.metadata);
      const expectedMetadata = [
        entityFixtures.correct1.metadata,
        entityFixtures.correct2.metadata,
        entityFixtures.correctInheritance.metadata,
      ];
      expect(correctMetadata).toEqual(expectedMetadata);
    });

    it('should repair parent denormalization in selects and multiselects', async () => {
      const entity = entities[4];
      expect(entity.metadata).toEqual({
        select: expectedSelect(),
        multiselect: expectedMultiSelect(),
        select2: expectedSelect2(),
      });
    });

    it('should repair parent denormalization in inherited values', async () => {
      const entity = entities[6];
      expect(entity.metadata.inherited_select?.[0].inheritedValue).toEqual(expectedSelect());
      expect(entity.metadata.inherited_select?.[1].inheritedValue).toEqual(expectedSelect());
      expect(entity.metadata.inherited_multiselect?.[0].inheritedValue).toEqual(
        expectedMultiSelect()
      );
      expect(entity.metadata.inherited_select2?.[0].inheritedValue).toEqual(expectedSelect2());
    });
  });

  describe('with multiple languages', () => {
    beforeAll(async () => {
      await initTest(multiLanguageFixtures);
    });

    it('should signal reindex', async () => {
      expect(migration.reindex).toBe(true);
    });

    it('should denormalize the correct label in repaired data', async () => {
      const expectedSelects = [expectedSelect(), expectedSelect('es'), expectedSelect('pt')];
      const expectedSelect2s = [expectedSelect2(), expectedSelect2('es'), expectedSelect2('pt')];

      const expectedMultiselects = [
        expectedMultiSelect(),
        expectedMultiSelect('es'),
        expectedMultiSelect('pt'),
      ];

      const plainEntities = entities.slice(0, 3);
      expect(plainEntities.map(e => e.metadata.select)).toEqual(expectedSelects);
      expect(plainEntities.map(e => e.metadata.multiselect)).toEqual(expectedMultiselects);
      expect(plainEntities.map(e => e.metadata.select2)).toEqual(expectedSelect2s);

      const entitiesWithInheritance = entities.slice(3, 6);
      expect(
        entitiesWithInheritance.map(e => e.metadata.inherited_select?.[0].inheritedValue)
      ).toEqual(expectedSelects);
      expect(
        entitiesWithInheritance.map(e => e.metadata.inherited_multiselect?.[0].inheritedValue)
      ).toEqual(expectedMultiselects);
      expect(
        entitiesWithInheritance.map(e => e.metadata.inherited_select2?.[0].inheritedValue)
      ).toEqual(expectedSelect2s);
    });
  });

  describe("when there's nothing to do", () => {
    beforeAll(async () => {
      await initTest(correctFixtures);
    });

    it('should not signal reindex', async () => {
      expect(migration.reindex).toBe(false);
    });

    it('should not change anything', async () => {
      expect(entities).toEqual(correctFixtures.entities);
    });
  });
});
