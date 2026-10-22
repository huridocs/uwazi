/* eslint-disable max-statements */
import { Db, ObjectId } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture } from '../types.js';
import {
  alreadyNamedId,
  documentMissingOriginalnameId,
  emptyFixtures,
  emptyOriginalnameId,
  fixtures,
  missingOriginalnameId,
  nullOriginalnameId,
  thumbnailWithEmptyFilenameId,
  thumbnailWithoutFilenameId,
} from './fixtures.js';

let db: Db;

const load = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
};

const fileById = async (id: ObjectId) => db.collection('files').findOne({ _id: id });

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration set-thumbnail-originalname', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(214);
  });

  it('should need no Postgres schema, touching Mongo only', () => {
    expect(migration.requiresSchema).toBe(0);
  });

  it('should not need a reindex: thumbnail originalname is not indexed', () => {
    expect(migration.reindex).toBe(false);
  });

  describe('when thumbnails are missing originalname', () => {
    beforeAll(async () => {
      await load(fixtures);
      // The shared fixture type cannot store null. This is the shape V1 left behind.
      await db
        .collection('files')
        .updateOne({ _id: nullOriginalnameId }, { $set: { originalname: null } });
      expect((await fileById(nullOriginalnameId))!.originalname).toBeNull();
      await migration.up(db);
    });

    it('should set originalname to filename when the field is absent', async () => {
      const thumbnail = await fileById(missingOriginalnameId);
      expect(thumbnail).toMatchObject({
        filename: 'missing.jpg',
        originalname: 'missing.jpg',
        entity: 'entity-missing',
        language: 'eng',
        mimetype: 'image/jpeg',
      });
    });

    it('should set originalname to filename when originalname is null', async () => {
      const thumbnail = await fileById(nullOriginalnameId);
      expect(thumbnail).toMatchObject({
        filename: 'null-name.jpg',
        originalname: 'null-name.jpg',
        entity: 'entity-null',
        language: 'spa',
      });
    });

    it('should set originalname to filename when originalname is an empty string', async () => {
      const thumbnail = await fileById(emptyOriginalnameId);
      expect(thumbnail).toMatchObject({
        filename: 'empty-name.jpg',
        originalname: 'empty-name.jpg',
        entity: 'entity-empty',
        language: 'fra',
      });
    });

    it('should leave a thumbnail that already has an originalname unchanged', async () => {
      const thumbnail = await fileById(alreadyNamedId);
      expect(thumbnail).toMatchObject({
        filename: 'stored-file.jpg',
        originalname: 'Human Name.jpg',
        entity: 'entity-named',
      });
    });

    it('should leave a non-thumbnail that is missing originalname unchanged', async () => {
      const document = await fileById(documentMissingOriginalnameId);
      expect(document).toMatchObject({
        type: 'document',
        filename: 'doc.pdf',
        entity: 'entity-document',
      });
      expect(document!.originalname).toBeUndefined();
    });

    it('should leave a thumbnail with no filename unchanged', async () => {
      const thumbnail = await fileById(thumbnailWithoutFilenameId);
      expect(thumbnail).toMatchObject({
        type: 'thumbnail',
        entity: 'entity-no-filename',
      });
      expect(thumbnail!.filename).toBeUndefined();
      expect(thumbnail!.originalname).toBeUndefined();
    });

    it('should leave a thumbnail whose filename is empty unchanged', async () => {
      const thumbnail = await fileById(thumbnailWithEmptyFilenameId);
      expect(thumbnail).toMatchObject({
        type: 'thumbnail',
        filename: '',
        entity: 'entity-empty-filename',
      });
      expect(thumbnail!.originalname).toBeUndefined();
    });

    it('should give the same result when run twice', async () => {
      await migration.up(db);

      expect(await fileById(missingOriginalnameId)).toMatchObject({ originalname: 'missing.jpg' });
      expect(await fileById(nullOriginalnameId)).toMatchObject({ originalname: 'null-name.jpg' });
      expect(await fileById(emptyOriginalnameId)).toMatchObject({ originalname: 'empty-name.jpg' });
      expect(await fileById(alreadyNamedId)).toMatchObject({ originalname: 'Human Name.jpg' });
      expect((await fileById(documentMissingOriginalnameId))!.originalname).toBeUndefined();
    });
  });

  describe('when the files collection is empty', () => {
    beforeAll(async () => {
      await load(emptyFixtures);
      await migration.up(db);
    });

    it('should leave the collection empty', async () => {
      expect(await db.collection('files').find().toArray()).toEqual([]);
    });
  });
});
