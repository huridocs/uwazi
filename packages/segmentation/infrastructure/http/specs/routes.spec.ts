import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { adminUser, collabUser, fixtures, uploadId } from '#api/files/specs/fixtures.js';
import { testingEnvironment, mutatePersistedSettings } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserSchema } from '#shared/types/userType.js';
import { SegmentationRoutes } from '../SegmentationRoutes.js';

describe('segmentation routes', () => {
  let requestMockedUser: UserSchema = adminUser;

  const app: Application = setUpApp(
    SegmentationRoutes.register,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = requestMockedUser;
      next();
    }
  );

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  beforeEach(async () => {
    requestMockedUser = adminUser;
  });

  describe('GET /api/v2/files/:id/segmentation', () => {
    it('should return the stored segmentation, in the shape the endpoint has always had', async () => {
      await mutatePersistedSettings(settings =>
        settings.apply({ features: { segmentation: { url: 'http://localhost:1235' } } }, () => '')
      );
      const [stored] = await testingEnvironment.db.getAllFrom('segmentations');
      await testingEnvironment.db.getCollection('segmentations')?.updateOne(
        { fileID: uploadId },
        {
          $set: {
            segmentation: {
              page_height: 841,
              page_width: 595,
              paragraphs: [
                {
                  left: 58,
                  top: 63,
                  width: 457,
                  height: 15,
                  page_number: 1,
                  text: 'A sample paragraph from segmentation',
                  type: 'Title',
                },
              ],
            },
          },
        }
      );

      const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

      expect(response).toHaveStatus(200);
      expect(response.get('Content-Type')).toContain('application/json');
      expect(response.body).toEqual({
        id: stored._id.toString(),
        fileId: uploadId.toString(),
        documentId: uploadId.toString(),
        status: 'ready',
        filename: 'english_testing_file.pdf',
        xmlname: 'english_testing_file.xml',
        autoExpire: null,
        pageHeight: 841,
        pageWidth: 595,
        paragraphs: [
          {
            left: 58,
            top: 63,
            width: 457,
            height: 15,
            pageNumber: 1,
            text: 'A sample paragraph from segmentation',
            type: 'Title',
          },
        ],
      });
    });

    it('should return 404 when segmentation feature is disabled on settings', async () => {
      await mutatePersistedSettings(settings => settings.apply({ features: {} }, () => ''));

      const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

      expect(response).toHaveStatus(404);
    });

    it('should return 404 for a file without a ready segmentation', async () => {
      await mutatePersistedSettings(settings =>
        settings.apply({ features: { segmentation: { url: 'http://localhost:1235' } } }, () => '')
      );

      const response = await request(app).get(
        '/api/v2/files/ffffffffffffffffffffffff/segmentation'
      );

      expect(response).toHaveStatus(404);
    });

    it('should return 401 for non-admin users', async () => {
      requestMockedUser = collabUser;

      const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

      expect(response).toHaveStatus(401);
    });
  });
});
