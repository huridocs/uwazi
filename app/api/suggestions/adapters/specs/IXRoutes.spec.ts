import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { Application } from 'express';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { UserRole } from 'shared/types/userSchema';
import request from 'supertest';
import { informationExtractionRoutes } from '../IXRoutes';

const checkValidationForRoute = async (
  app: Application,
  method: 'get' | 'post' | 'delete',
  route: string
) => {
  const req = request(app)[method](route);
  if (method === 'post') {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    req.send({ not_allowed_property: { key: 'value' } });
  }

  const response = await req;

  expect(response.statusCode).toBe(422);
  expect(response.body.error).toContain('validation failed');
};

describe('IX Routes (Information Extraction)', () => {
  const f = getFixturesFactory();

  const user = f.user('admin', UserRole.ADMIN);

  const template = f.template('Test Template', [
    f.property('text_property', 'text', { label: 'Text Property' }),
  ]);

  const extractor = {
    _id: f.id('ixExtractor'),
    name: 'Test Extractor',
    property: 'text_property',
    templates: [template._id],
    source: {
      pdf: true,
    },
  };

  const entity = f.entity('test_entity', template.name);

  const file = f.document('test_document', {
    entity: entity.sharedId,
    language: 'en' as LanguageISO6391,
    filename: 'test.pdf',
    type: 'document',
  });

  const fixtures: DBFixture = {
    users: [user],
    templates: [template],
    ixextractors: [extractor],
    entities: [entity],
    files: [file],
    settings: [
      {
        languages: [
          { key: 'en' as LanguageISO6391, label: 'English', default: true },
          { key: 'es' as LanguageISO6391, label: 'Spanish' },
        ],
      },
    ],
  };

  const app: Application = setUpApp(informationExtractionRoutes, (req, _res, next) => {
    (req as any).user = user;
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('POST /api/informationExtraction/labeledData', () => {
    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'post', '/api/informationExtraction/labeledData');
    });

    it('should save labeled data', async () => {
      const body = {
        extractorId: extractor._id.toString(),
        sourceId: file._id.toString(),
        labeledData: {
          propertyID: template.properties[0]._id!.toString(),
          name: 'test_property',
          timestamp: new Date().toISOString(),
          deleteSelection: false,
          selection: {
            text: 'Selected text for testing',
            selectionRectangles: [
              {
                top: 100,
                left: 100,
                width: 200,
                height: 50,
                page: '1',
              },
            ],
          },
        },
      };

      const response = await request(app).post('/api/informationExtraction/labeledData').send(body);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ success: true });

      const [updatedFile] = await testingEnvironment.db.getAllFrom('files');
      expect(updatedFile?.extractedMetadata).toHaveLength(1);
      expect(updatedFile?.extractedMetadata[0]).toMatchObject(body.labeledData);
    });
  });
});
