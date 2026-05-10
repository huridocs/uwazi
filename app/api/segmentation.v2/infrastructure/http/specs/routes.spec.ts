import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import settings from '#api/settings/settings.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserSchema } from '#shared/types/userType.js';
import { adminUser, collabUser, fixtures, uploadId } from '#api/files/specs/fixtures.js';
import { segmentationV2Routes } from '../routes.js';

describe('segmentation v2 routes', () => {
  let requestMockedUser: UserSchema = adminUser;

  const app: Application = setUpApp(
    segmentationV2Routes,
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

  it('should return segmentation data stored for the file when feature is enabled', async () => {
    await settings.save({ features: { segmentation: { url: 'http://localhost:1235' } } });
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
                type: 'paragraph',
              },
            ],
          },
        },
      }
    );

    const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

    expect(response).toHaveStatus(200);
    expect(response.get('Content-Type')).toContain('application/json');
    expect(response.body).toMatchObject({
      fileId: uploadId.toString(),
      status: 'ready',
      filename: 'english_testing_file.pdf',
      xmlname: 'english_testing_file.xml',
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
          type: 'paragraph',
        },
      ],
    });
  });

  it('should return 404 when segmentation feature is disabled on settings', async () => {
    await settings.save({ features: {} });

    const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

    expect(response).toHaveStatus(404);
  });

  it('should return 401 for non-admin users', async () => {
    requestMockedUser = collabUser;

    const response = await request(app).get(`/api/v2/files/${uploadId.toString()}/segmentation`);

    expect(response).toHaveStatus(401);
  });
});
