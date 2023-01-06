import { Application } from 'express';
import { Db } from 'mongodb';
import request from 'supertest';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { suggestionsRoutes } from '../routes';

const adminUser = {
  username: 'User 1',
  role: UserRole.ADMIN,
  email: 'user@test.com',
};

const app: Application = setUpApp(suggestionsRoutes, (req, _res, next) => {
  req.user = adminUser;
  next();
});

const fixturesFactory = getFixturesFactory();

const existingExtractor = {
  _id: fixturesFactory.id('extractor1'),
  extractorId: 'extId1',
  name: 'ext1',
  property: 'text_property',
  templates: [fixturesFactory.id('template1')],
};

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        {
          default: true,
          key: 'en',
          label: 'English',
        },
        {
          key: 'es',
          label: 'Spanish',
        },
      ],
      features: {
        metadataExtraction: {
          url: 'https://metadataextraction.com',
        },
      },
    },
  ],
  templates: [
    fixturesFactory.template('template1', [
      fixturesFactory.property('text_property', 'text'),
      fixturesFactory.property('number_property', 'numeric'),
      fixturesFactory.property('other_text_property', 'text'),
    ]),
    fixturesFactory.template('template2', [
      fixturesFactory.property('text_property', 'text'),
      fixturesFactory.property('number_property', 'numeric'),
    ]),
  ],
  ixextractors: [
    existingExtractor,
    {
      _id: fixturesFactory.id('extractor2'),
      extractorId: 'extId2',
      name: 'ext2',
      property: 'text_property',
      templates: [fixturesFactory.id('template1')],
    },
    {
      _id: fixturesFactory.id('extractor3'),
      extractorId: 'extId3',
      name: 'ext3',
      property: 'text_property',
      templates: [fixturesFactory.id('template1')],
    },
  ],
};

describe('extractor routes', () => {
  let db: Db | null;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    db = testingDB.mongodb;
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST /api/ixextractors/create', () => {
    it.each([
      {
        reason: 'non existing template',
        expectedMessage: 'Missing template.',
        input: {
          name: 'extr1',
          property: 'text_property',
          templates: [
            fixturesFactory.id('template1').toString(),
            fixturesFactory.id('non_existing_template').toString(),
          ],
        },
      },
      {
        reason: 'non existing non existing property (in template)',
        expectedMessage: 'Missing property.',
        input: {
          name: 'extr1',
          property: 'other_text_property',
          templates: [
            fixturesFactory.id('template1').toString(),
            fixturesFactory.id('template2').toString(),
          ],
        },
      },
    ])('should reject $reason', async ({ input, expectedMessage }) => {
      const response = await request(app).post('/api/ixextractors/create').send(input).expect(500);
      expect(response.body.error).toBe(expectedMessage);
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.length).toBe(3);
    });

    it.each([
      {
        input: {
          name: 'extr1',
          property: 'text_property',
          templates: [
            fixturesFactory.id('template1').toString(),
            fixturesFactory.id('template2').toString(),
          ],
        },
        expectedInDb: {
          extractorId: expect.any(String),
          name: 'extr1',
          property: 'text_property',
          templates: [fixturesFactory.id('template1'), fixturesFactory.id('template2')],
        },
      },
      {
        input: {
          name: 'extr2',
          property: 'number_property',
          templates: [fixturesFactory.id('template2').toString()],
        },
        expectedInDb: {
          extractorId: expect.any(String),
          name: 'extr2',
          property: 'number_property',
          templates: [fixturesFactory.id('template2')],
        },
      },
    ])('should create and return extractor', async ({ input, expectedInDb }) => {
      const response = await request(app).post('/api/ixextractors/create').send(input).expect(200);

      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.[3]).toMatchObject(expectedInDb);

      expect(response.body).toMatchObject({ ...input, extractorId: expect.any(String) });
    });
  });

  describe('POST /api/ixextractors/update', () => {
    it.each([
      {
        reason: 'non existing extractorId',
        expectedMessage: 'Missing extractor.',
        change: {
          extractorId: 'non-existing-extractor-id',
        },
      },
      {
        reason: 'non existing template',
        expectedMessage: 'Missing template.',
        change: {
          templates: [
            fixturesFactory.id('template1'),
            fixturesFactory.id('non_existing_template').toString(),
          ],
        },
      },
      {
        reason: 'non existing non existing property (in template)',
        expectedMessage: 'Missing property.',
        change: {
          property: 'non-existing-property',
        },
      },
    ])('should reject $reason', async ({ change, expectedMessage }) => {
      const input: any = { ...existingExtractor, ...change };
      delete input._id;
      const response = await request(app).post('/api/ixextractors/update').send(input).expect(500);
      expect(response.body.error).toBe(expectedMessage);
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.[0]).toMatchObject(existingExtractor);
    });

    it.each([
      {
        updateTarget: 'name',
        change: {
          name: 'new_extractor_name',
        },
      },
      {
        updateTarget: 'property',
        change: {
          property: 'number_property',
        },
      },
      {
        updateTarget: 'adding template',
        change: {
          templates: [fixturesFactory.id('template1'), fixturesFactory.id('template2')],
        },
      },
      {
        updateTarget: 'changing template',
        change: {
          templates: [fixturesFactory.id('template2')],
        },
      },
      {
        updateTarget: 'everything',
        change: {
          name: 'new_extractor_name',
          property: 'number_property',
          templates: [fixturesFactory.id('template2')],
        },
      },
    ])('should update $updateTarget', async ({ change }) => {
      const input: any = { ...existingExtractor, ...change };
      delete input._id;
      const response = await request(app).post('/api/ixextractors/update').send(input).expect(200);
      expect(response.body).toMatchObject(input);
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.[0]).toMatchObject(input);
    });
  });

  describe('POST /api/ixextractors/delete', () => {
    it('should reject non existing extractorId', async () => {
      const input = ['extId1', 'non-existing-extractorId'];
      const response = await request(app).post('/api/ixextractors/delete').send(input).expect(500);
      expect(response.body.error).toBe('Missing extractor.');
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.length).toBe(3);
    });

    it('should delete extractor', async () => {
      const input = ['extId1', 'extId2'];
      await request(app).post('/api/ixextractors/delete').send(input).expect(200);
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.length).toBe(1);
    });
  });
});
