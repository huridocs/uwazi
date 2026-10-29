/* eslint-disable max-statements */
import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import {
  alreadyEqualFixture,
  alreadyNewFixture,
  collisionFixture,
  disagreeFixture,
  otherTemplateId,
  renameFixture,
  templateId,
  type LoadedFixture,
} from './fixtures.js';

let db: Db;

const run = async (fixture: LoadedFixture) => {
  await testingDB.setupFixturesAndContext<LoadedFixture>(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration apply-new-property-names', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(215);
  });

  describe('when the flag is already true', () => {
    beforeAll(async () => {
      migration.reindex = true;
      await run(alreadyNewFixture());
    });

    it('should leave stored names and not request a reindex', async () => {
      const template = await db.collection('templates').findOne({ _id: templateId });
      const country = template?.properties?.find(
        (property: { name: string; label: string }) => property.label === 'País'
      );

      expect(country?.name).toBe('pa_s');
      expect(migration.reindex).toBe(false);
    });
  });

  describe('when names already match the new algorithm', () => {
    beforeAll(async () => {
      migration.reindex = true;
      await run(alreadyEqualFixture());
    });

    it('should set the flag and not request a reindex', async () => {
      const settings = await db.collection('settings').findOne({});
      const template = await db.collection('templates').findOne({ _id: templateId });

      expect(settings?.newNameGeneration).toBe(true);
      expect(template?.properties?.[0]?.name).toBe('pais');
      expect(migration.reindex).toBe(false);
    });
  });

  describe('when a property name changes', () => {
    beforeAll(async () => {
      migration.reindex = false;
      await run(renameFixture());
    });

    it('should rename template properties, metadata, files, extractors and suggestions', async () => {
      const template = await db.collection('templates').findOne({ _id: templateId });
      const names = template?.properties?.map((property: { name: string }) => property.name);
      const entity = await db.collection('entities').findOne({ sharedId: 'entity-1' });
      const other = await db.collection('entities').findOne({ sharedId: 'entity-2' });
      const files = await db.collection('files').find().sort({ entity: 1 }).toArray();
      const extractor = await db.collection('ixextractors').findOne({ name: 'country' });
      const titleExtractor = await db.collection('ixextractors').findOne({ name: 'title' });
      const suggestions = await db.collection('ixsuggestions').find().toArray();

      expect(names).toEqual(['país', 'pa', 'ubicación_geolocation']);
      expect(template?.commonProperties?.[0]?.name).toBe('title');
      expect(entity?.metadata).toEqual({ país: [{ value: 'a' }], pa: [{ value: 'b' }] });
      expect(other?.metadata).toEqual({ pa_s: [{ value: 'stay' }] });
      expect(files.find(file => file.entity === 'entity-1')?.propertySelections).toEqual([
        { name: 'país' },
        { name: 'title' },
      ]);
      expect(files.find(file => file.entity === 'entity-2')?.propertySelections).toEqual([
        { name: 'pa_s' },
      ]);
      expect(extractor).toMatchObject({
        property: 'país',
        source: { property: 'ubicación_geolocation' },
      });
      expect(titleExtractor?.property).toBe('title');
      expect(suggestions.map(suggestion => suggestion.propertyName).sort()).toEqual([
        'pa_s',
        'país',
        'title',
      ]);
      expect(
        suggestions.find(suggestion => suggestion.entityTemplate === otherTemplateId.toString())
          ?.propertyName
      ).toBe('pa_s');
    });

    it('should rewrite stored queries and aggregations, and set the flag', async () => {
      const settings = await db.collection('settings').findOne({});
      const page = await db.collection('pages').findOne({});
      const release = await db.collection('page_releases').findOne({});

      expect(settings?.newNameGeneration).toBe(true);
      expect(settings?.links?.[0]?.url).toBe('/en/library/?q=(país:1)');
      expect(settings?.links?.[1]?.sublinks?.[0]?.url).toBe('/library/?q=(país:2)');
      expect(settings?.home_page).toBe('/library/?q=(filters:(país:3))');
      expect(page?.locales?.en?.draft?.content).toBe('/library/?q=(país:1,pa:2,pa_sx:3)');
      expect(page?.locales?.en?.draft?.script).toBe('property="país" filterProperty="país"');
      expect(page?.draft?.content).toBe('{list}(país:4)');
      expect(page?.draft?.script).toBe('untouched pa_s');
      expect(page?.metadata?.content).toBe('/library/?q=(sort:país)');
      expect(release?.en?.content).toBe('{list}(país:5)');
      expect(release?.en?.script).toBe("property='país'");
      expect(migration.reindex).toBe(true);
    });

    it('should leave the same data when run again', async () => {
      const before = await db.collection('templates').findOne({ _id: templateId });
      await migration.up(db);
      const after = await db.collection('templates').findOne({ _id: templateId });

      expect(after).toEqual(before);
      expect(migration.reindex).toBe(false);
    });
  });

  describe('when two properties would share a name', () => {
    it('should fail the tenant and leave the flag unset', async () => {
      await testingDB.setupFixturesAndContext<LoadedFixture>(collisionFixture());
      db = testingDB.mongodb!;

      await expect(migration.up(db)).rejects.toThrow(/collid/i);
      const settings = await db.collection('settings').findOne({});
      expect(settings?.newNameGeneration).toBeUndefined();
    });
  });

  describe('when an extractor spans templates that rename differently', () => {
    it('should fail the tenant', async () => {
      await testingDB.setupFixturesAndContext<LoadedFixture>(disagreeFixture());
      db = testingDB.mongodb!;

      await expect(migration.up(db)).rejects.toThrow(/extractor/i);
    });
  });

  it('should do nothing when there is no settings document', async () => {
    migration.reindex = true;
    await run({});

    expect(migration.reindex).toBe(false);
    expect(await db.collection('settings').countDocuments()).toBe(0);
  });
});
