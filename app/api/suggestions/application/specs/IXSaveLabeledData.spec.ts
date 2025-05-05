import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import {
  mongoIXExtractorsCollection,
  MongoIXExtractorsDataSource,
} from 'api/suggestions/infrastructure/MongoIXExtractorsDataSource';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';

import { MongoIXExtractorDBO } from 'api/suggestions/infrastructure/MongoIXExtractorDBO';

import { IXErrorCode } from 'api/suggestions/domain/IXValidationError';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { IXSaveLabeledData } from '../IXSaveLabeledData';

const f = getFixturesFactory();

const entity = f.entity('Test Entity', 'template1', {});
const documentFile = f.document('testFile', { entity: 'Test Entity', language: 'en' });
const attachment = f.attachment('testAttachment');
const fileWithoutEntity = f.document('fileWithoutEntity', {
  entity: 'nonExistentEntity',
  language: 'en',
});

const extractor: MongoIXExtractorDBO = {
  _id: new ObjectId(),
  name: 'Text Extractor',
  property: 'title',
  templates: [f.idString('template1')],
  source: {
    pdf: true,
    property: 'title',
  },
};

const extractorWithoutProperty: MongoIXExtractorDBO = {
  _id: new ObjectId(),
  name: 'Invalid Extractor',
  property: '',
  templates: [f.idString('template1')],
  source: {
    pdf: true,
  },
};

const template1 = f.template('template1');

const createFixtures = () => ({
  [mongoIXExtractorsCollection]: [extractor, extractorWithoutProperty],
  entities: [entity],
  templates: [template1],
  files: [documentFile, fileWithoutEntity, attachment],
});

const setUpUseCase = () => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();
  const entityDS = DefaultEntitiesDataSource(mongoTransactionManager);
  const filesDS = DefaultFilesDataSource(mongoTransactionManager);
  const extractorsDS = new MongoIXExtractorsDataSource(connection, mongoTransactionManager);
  const templatesDS = new MongoTemplatesDataSource(connection, mongoTransactionManager);

  const saveExtractedText = new IXSaveLabeledData({
    entityDS,
    extractorsDS,
    templatesDS,
    filesDS,
  });

  return {
    saveExtractedText,
    filesDS,
  };
};

describe('IXSaveExtractedText', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when source is pdf', () => {
    it('should save extracted text and metadata to the configured property and file', async () => {
      const { saveExtractedText } = setUpUseCase();
      const labeledData = {
        name: 'labeledData',
        propertyID: extractor.property,
        timestamp: new Date().toISOString(),
        deleteSelection: false,
        selection: {
          text: 'This is the extracted text',
          selectionRectangles: [
            {
              top: 100,
              left: 200,
              width: 300,
              height: 50,
              page: '1',
            },
          ],
        },
      };

      await saveExtractedText.execute({
        extractorId: extractor._id.toString(),
        sourceId: f.idString('testFile'),
        labeledData,
        language: 'en',
      });

      const [updatedEntity] = await testingEnvironment.db.getAllFrom('entities');
      expect(updatedEntity.title).toBe(labeledData.selection.text);

      const [updatedFile] = await testingEnvironment.db.getAllFrom('files');
      expect(updatedFile.extractedMetadata).toMatchObject([
        {
          name: 'labeledData',
          selection: {
            text: labeledData.selection.text,
            selectionRectangles: labeledData.selection.selectionRectangles,
          },
        },
      ]);
    });
  });

  it.each([
    {
      description: 'should throw if extractor does not exist',
      extractorId: () => new ObjectId().toString(),
      sourceId: 'testFile',
      expectedError: IXErrorCode.EXTRACTOR_NOT_FOUND,
    },
    {
      description: 'should throw if file does not exist',
      extractorId: () => extractor._id.toString(),
      sourceId: 'nonExistentFile',
      expectedError: IXErrorCode.FILE_NOT_FOUND,
    },
    {
      description: 'should throw if entity does not exist',
      extractorId: () => extractor._id.toString(),
      sourceId: 'fileWithoutEntity',
      expectedError: IXErrorCode.ENTITY_NOT_FOUND,
    },
    {
      description: 'should throw if file is not a document',
      extractorId: () => extractor._id.toString(),
      sourceId: 'testAttachment',
      expectedError: IXErrorCode.FILE_IS_NOT_DOCUMENT,
    },
  ])('$description', async ({ extractorId, sourceId, expectedError }) => {
    const { saveExtractedText } = setUpUseCase();

    const promise = saveExtractedText.execute({
      extractorId: extractorId(),
      sourceId: f.idString(sourceId),
      language: 'en',
      labeledData: {
        deleteSelection: false,
        name: 'test',
        timestamp: new Date().toISOString(),
        propertyID: extractor.property,
        selection: { text: 'test', selectionRectangles: [] },
      },
    });

    await expect(promise).rejects.toMatchObject({
      code: expectedError,
    });
  });
});
