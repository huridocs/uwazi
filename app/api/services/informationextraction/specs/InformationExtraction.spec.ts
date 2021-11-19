/* eslint-disable camelcase */
/* eslint-disable max-lines */

import asyncFS from 'api/utils/async-fs';
import request from 'shared/JSONRequest';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setupTestUploadedPaths } from 'api/files';
import { fixtures, factory } from './fixtures';
import { InformationExtraction } from '../InformationExtraction';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('InformationExtraction', () => {
  let informationExtraction: InformationExtraction;
  let xmlA: Buffer;

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    await setupTestUploadedPaths('services/informationextraction');
    informationExtraction = new InformationExtraction();
    console.log(informationExtraction);
    jest.spyOn(request, 'uploadFile').mockResolvedValue({});
    jest.resetAllMocks();
  });

  describe('trainModel', () => {
    it('should send the xmls and labeled data', async () => {
      console.log(informationExtraction);
      await informationExtraction.trainModel(
        factory.id('templateToSegmentA').toString(),
        'property1'
      );

      xmlA = await asyncFS.readFile(
        'app/api/services/informationExtraction/specs/uploads/documentA.xml'
      );

      expect(request.uploadFile).toHaveBeenCalledWith(
        'http://localhost:1234/files/tenantOne',
        'documentA.xml',
        xmlA
      );
      // expect(request.post).toHaveBeenCalledWith('/api/informationextraction/train', {});
    });
  });
});
