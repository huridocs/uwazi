import testingDB from '#api/utils/testing_db.js';
import { Db } from 'mongodb';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

let db: Db | null;

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration fix_property_name_mismatches', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(183);
  });

  it('should skip migration when newNameGeneration setting is false', async () => {
    await db?.collection('settings').updateOne({}, { $set: { newNameGeneration: false } });

    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();
    const templateWithMismatch = templates?.find(t => t.name === 'Template with Mismatches');

    expect(templateWithMismatch?.properties?.[0].name).toBe('text');
    expect(migration.reindex).toBe(false);
  });

  it('should not modify templates that already have correct property names', async () => {
    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();
    const correctTemplate = templates?.find(t => t.name === 'Template Already Correct');

    expect(correctTemplate?.properties?.[0].name).toBe('text_field');
    expect(correctTemplate?.properties?.[1].name).toBe('simple_name');
  });

  it('should fix template property names that do not match their labels', async () => {
    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();
    const fixedTemplate = templates?.find(t => t.name === 'Template with Mismatches');

    expect(fixedTemplate?.properties?.[0].name).toBe('text_field_');
    expect(fixedTemplate?.properties?.[1].name).toBe('email_address_');
  });

  it('should update entity metadata keys to match new template property names', async () => {
    await migration.up(db!);

    const entities = await db?.collection('entities').find({}).toArray();
    const entityEN = entities?.find(e => e.title === 'Entity 1 EN');
    const entityES = entities?.find(e => e.title === 'Entity 1 ES');
    const entityPT = entities?.find(e => e.title === 'Entity 1 PT');

    // Check EN entity
    expect(entityEN?.metadata?.text).toBeUndefined();
    expect(entityEN?.metadata?.text_field_).toBeDefined();
    expect(entityEN?.metadata?.text_field_?.[0].value).toBe('some text');

    expect(entityEN?.metadata?.emailaddress).toBeUndefined();
    expect(entityEN?.metadata?.email_address_).toBeDefined();
    expect(entityEN?.metadata?.email_address_?.[0].value).toBe('test@example.com');

    // Check ES entity
    expect(entityES?.metadata?.text).toBeUndefined();
    expect(entityES?.metadata?.text_field_).toBeDefined();
    expect(entityES?.metadata?.text_field_?.[0].value).toBe('algún texto');

    // Check PT entity
    expect(entityPT?.metadata?.text).toBeUndefined();
    expect(entityPT?.metadata?.text_field_).toBeDefined();
    expect(entityPT?.metadata?.text_field_?.[0].value).toBe('algum texto');
  });

  it('should handle geolocation properties with _geolocation suffix', async () => {
    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();
    const geoTemplate = templates?.find(t => t.name === 'Template with Geolocation');

    expect(geoTemplate?.properties?.[0].name).toBe('location_geolocation');

    const entities = await db?.collection('entities').find({}).toArray();
    const geoEntity = entities?.find(e => e.title === 'Entity 3');

    expect(geoEntity?.metadata?.location).toBeUndefined();
    expect(geoEntity?.metadata?.location_geolocation).toBeDefined();
    expect(geoEntity?.metadata?.location_geolocation?.[0].value).toEqual({
      lat: 40.7128,
      lon: -74.006,
    });
  });

  it('should not modify commonProperties array', async () => {
    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();

    templates?.forEach(template => {
      if (template.commonProperties) {
        template.commonProperties.forEach((prop: any) => {
          // Common properties should remain unchanged
          if (prop.label === 'Date added') {
            expect(prop.name).toBe('creationDate');
          }
        });
      }
    });
  });

  it('should handle templates with multiple properties needing fixes', async () => {
    await migration.up(db!);

    const templates = await db?.collection('templates').find({}).toArray();
    const multiTemplate = templates?.find(t => t.name === 'Template Multiple Mismatches');

    expect(multiTemplate?.properties?.[0].name).toBe('property_one');
    expect(multiTemplate?.properties?.[1].name).toBe('property_two_');
    expect(multiTemplate?.properties?.[2].name).toBe('property_three');
  });

  it('should update all entities for a template in a single operation', async () => {
    await migration.up(db!);

    const entities = await db?.collection('entities').find({}).toArray();
    const entity4EN = entities?.find(e => e.title === 'Entity 4 EN');
    const entity4ES = entities?.find(e => e.title === 'Entity 4 ES');

    // Both entities should have updated property names
    expect(entity4EN?.metadata?.prop1).toBeUndefined();
    expect(entity4EN?.metadata?.property_one).toBeDefined();
    expect(entity4EN?.metadata?.property_one?.[0].value).toBe('value one');

    expect(entity4ES?.metadata?.prop1).toBeUndefined();
    expect(entity4ES?.metadata?.property_one).toBeDefined();
    expect(entity4ES?.metadata?.property_one?.[0].value).toBe('valor uno');
  });

  it('should handle entities with empty metadata gracefully', async () => {
    await migration.up(db!);

    const entities = await db?.collection('entities').find({}).toArray();
    const entityEmpty = entities?.find(e => e.title === 'Entity 5 Empty');

    expect(entityEmpty?.metadata).toEqual({});
  });

  it('should handle entities with partial metadata (not all template properties present)', async () => {
    await migration.up(db!);

    const entities = await db?.collection('entities').find({}).toArray();
    const partialEntity = entities?.find(e => e.title === 'Entity 6 Partial');

    // Only prop1 was present, so only it should be renamed
    expect(partialEntity?.metadata?.prop1).toBeUndefined();
    expect(partialEntity?.metadata?.property_one).toBeDefined();
    expect(partialEntity?.metadata?.property_one?.[0].value).toBe('only first property');

    // Other properties should not exist
    expect(partialEntity?.metadata?.prop2).toBeUndefined();
    expect(partialEntity?.metadata?.property_two_).toBeUndefined();
  });

  it('should set reindex flag to true when changes are made', async () => {
    const reindexAfterMigration = await migration.up(db!);
    expect(reindexAfterMigration).toBe(true);
  });

  it('should set reindex flag to false when no changes are needed', async () => {
    // First, run the migration to fix everything
    await migration.up(db!);
    expect(migration.reindex).toBe(true);

    // Then run it again - should return false since nothing needs changing
    await migration.up(db!);
    expect(migration.reindex).toBe(false);
  });
});
