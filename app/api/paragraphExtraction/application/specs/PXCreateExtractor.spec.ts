/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { PXErrorCode } from 'api/paragraphExtraction/domain/PXValidationError';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from '../../infrastructure/MongoPXExtractorsDataSource';
import { PXCreateExtractor } from '../PXCreateExtractor';

const factory = getFixturesFactory();

const setUpUseCase = () => {
  const transaction = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(transaction);

  const extractorDS = new MongoPXExtractorsDataSource(getConnection(), transaction);

  return {
    createExtractor: new PXCreateExtractor({
      extractorDS,
      templatesDS,
      idGenerator: MongoIdHandler,
    }),
  };
};

const sourceTemplate = factory.template('Source Template', [factory.property('text', 'text')]);
const paragraphProperty = factory.property('paragraphProperty', 'markdown');
const paragraphNumberProperty = factory.property('paragraphNumberProperty', 'numeric');
const textProperty = factory.property('textProperty', 'text');

const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
]);
const invalidTargetTemplate = factory.template('Invalid Target');

describe('PXCreateExtractor', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      templates: [sourceTemplate, targetTemplate, invalidTargetTemplate],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Extractor correctly', async () => {
    const { createExtractor } = setUpUseCase();

    await createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
    });

    const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

    expect(dbPXExtractors).toEqual([
      {
        _id: expect.any(ObjectId),
        sourceTemplateId: sourceTemplate._id,
        targetTemplateId: targetTemplate._id,
        paragraphPropertyId: paragraphProperty._id,
        paragraphNumberPropertyId: paragraphNumberProperty._id,
      },
    ]);
  });

  it('should throw if the paragraph Property does not exist on Template', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: new ObjectId().toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_PROPERTY_DOES_NOT_EXIST,
    });
  });

  it('should throw if the paragraph Property is not of the rich text type', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: textProperty._id!.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_PROPERTY_IS_NOT_OF_RICH_TEXT,
    });
  });

  it('should throw if the paragraph number Property does not exist on Template', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      paragraphNumberPropertyId: new ObjectId().toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_DOES_NOT_EXIST,
    });
  });

  it('should throw if the paragraph number Property is not of the number type', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
      paragraphNumberPropertyId: textProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.PARAGRAPH_NUMBER_PROPERTY_IS_NOT_A_NUMBER,
    });
  });

  it('should throw if target Template does not exist', async () => {
    const { createExtractor } = setUpUseCase();
    const targetTemplateId = new ObjectId().toString();

    const promise = createExtractor.execute({
      sourceTemplateId: sourceTemplate._id.toString(),
      targetTemplateId,
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.TARGET_TEMPLATE_NOT_FOUND,
    });
  });

  it('should throw if source Template does not exist', async () => {
    const { createExtractor } = setUpUseCase();
    const sourceTemplateId = new ObjectId().toString();

    const promise = createExtractor.execute({
      targetTemplateId: sourceTemplate._id.toString(),
      sourceTemplateId,
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.SOURCE_TEMPLATE_NOT_FOUND,
    });
  });

  it('should throw if target and source template are the same', async () => {
    const { createExtractor } = setUpUseCase();

    const promise = createExtractor.execute({
      sourceTemplateId: targetTemplate._id.toString(),
      targetTemplateId: targetTemplate._id.toString(),
      paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
      paragraphPropertyId: paragraphProperty._id!.toString(),
    });

    await expect(promise).rejects.toMatchObject({
      code: PXErrorCode.TARGET_SOURCE_TEMPLATE_EQUAL,
    });

    const dbPXExtractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
    expect(dbPXExtractors).toEqual([]);
  });
});
