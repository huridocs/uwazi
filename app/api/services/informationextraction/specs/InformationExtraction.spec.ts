/* eslint-disable camelcase */
/* eslint-disable max-lines */

import asyncFS from 'api/utils/async-fs';
import request from 'shared/JSONRequest';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { setupTestUploadedPaths } from 'api/files';
import { fixtures, factory } from './fixtures';
import { InformationExtraction } from '../InformationExtraction';
import { tenants } from 'api/tenants/tenantContext';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('InformationExtraction', () => {
  let informationExtraction: InformationExtraction;
  let xmlA: Buffer;

  beforeEach(async () => {
    informationExtraction = new InformationExtraction();
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      name: 'tenant1',
      uploadedDocuments: `${__dirname}/uploads/`,
    });

    jest.spyOn(request, 'uploadFile').mockResolvedValue({});
    jest.spyOn(request, 'post').mockResolvedValue({});
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('trainModel', () => {
    it('should send xmls', async () => {
      await informationExtraction.trainModel(
        [factory.id('templateToSegmentA')],
        'property1',
        'http://localhost:1234'
      );

      xmlA = await asyncFS.readFile(
        'app/api/services/informationExtraction/specs/uploads/documentA.xml'
      );

      expect(request.uploadFile).toHaveBeenCalledWith(
        'http://localhost:1234/xml_file/tenant1/property1',
        'documentA.xml',
        xmlA
      );
    });

    it('should send labeled date', async () => {
      await informationExtraction.trainModel(
        [factory.id('templateToSegmentA')],
        'property1',
        'http://localhost:1234'
      );

      expect(request.post).toHaveBeenCalledWith('http://localhost:1234/labeled_data', {
        label_text: 'something',
        language_iso: 'en',
        page_height: 841,
        page_width: 595,
        property_name: 'property1',
        tenant: 'tenant1',
        xml_file_name: 'documentA.xml',
        xml_segments_boxes: [
          {
            left: 58,
            top: 63,
            width: 457,
            height: 15,
            page_number: 1,
            text: 'something something',
          },
        ],
        label_segments_boxes: [{ top: 0, left: 0, width: 0, height: 0, page_number: '1' }],
      });
    });

    it('should start the task to train the model', async () => {
      await informationExtraction.trainModel(
        [factory.id('templateToSegmentA')],
        'property1',
        'http://localhost:1234'
      );

      expect(informationExtraction.taskManager?.startTask).toHaveBeenCalledWith({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'create_model',
      });
    });
  });

  describe('when model is trained', () => {
    it('should send the materials for the suggestions', async () => {
      await informationExtraction.processResults({
        params: { property_name: 'property1' },
        tenant: 'tenant1',
        task: 'create_model',
        success: true,
      });

      xmlA = await asyncFS.readFile(
        'app/api/services/informationExtraction/specs/uploads/documentA.xml'
      );

      expect(request.uploadFile).toHaveBeenCalledWith(
        'http://localhost:1234/xml_file/tenant1/property1',
        'documentA.xml',
        xmlA
      );

      expect(request.post).toHaveBeenCalledWith('http://localhost:1234/prediction_data', {
        xml_file_name: 'documentA.xml',
        property_name: 'property1',
        tenant: 'tenant1',
        page_height: 841,
        page_width: 595,
        xml_segments_boxes: [
          {
            height: 15,
            left: 58,
            page_number: 1,
            text: 'something something',
            top: 63,
            width: 457,
          },
        ],
      });

      expect(request.uploadFile).toHaveBeenCalledTimes(4);
      expect(request.post).toHaveBeenCalledTimes(4);
    });
  });
});
