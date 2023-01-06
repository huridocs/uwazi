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
};

describe('extractor routes', () => {
  let db: Db | null;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    db = testingDB.mongodb;
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST /api/ixextractors/create', () => {
    it('should reject non existing template', async () => {
      const input = {
        name: 'extr1',
        property: 'text_property',
        templates: [
          fixturesFactory.id('template1').toString(),
          fixturesFactory.id('non_existing_template').toString(),
        ],
      };
      const response = await request(app).post('/api/ixextractors/create').send(input).expect(500);
      expect(response.body.error).toBe('Missing template.');
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.length).toBe(0);
    });

    it('should reject non existing property (in template)', async () => {
      const input = {
        name: 'extr1',
        property: 'other_text_property',
        templates: [
          fixturesFactory.id('template1').toString(),
          fixturesFactory.id('template2').toString(),
        ],
      };
      const response = await request(app).post('/api/ixextractors/create').send(input).expect(500);
      expect(response.body.error).toBe('Missing property.');
      const extractors = await db?.collection('ixextractors').find().toArray();
      expect(extractors?.length).toBe(0);
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
      expect(extractors).toMatchObject([expectedInDb]);

      expect(response.body).toMatchObject({ ...input, extractorId: expect.any(String) });
    });
  });

  describe('POST /api/ixextractors/update', () => {
    it('should reject non existing extractorId', async () => {});

    it('should reject non existing template', async () => {});

    it('should reject non existing property (in template)', async () => {});

    it('should update name, property, templates in the extractor with the proper extractorId', async () => {});
  });

  describe('POST /api/ixextractors/delete', () => {
    it('should reject non existing extractorId', async () => {});

    it('should delete extractor', async () => {});
  });
});
function getUser(): any {
  throw new Error('Function not implemented.');
}
