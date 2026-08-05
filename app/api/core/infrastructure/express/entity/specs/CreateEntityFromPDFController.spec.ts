import type { Request, Response } from 'express';
import {
  CreateEntityFromPDFController,
  CreateEntityFromPDFRequest,
} from '../CreateEntityFromPDFController.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CreateEntityFromPDFUseCaseFactory } from '#api/core/infrastructure/factories/CreateEntityFromPDFUseCaseFactory.js';
import { CreateEntityFromPDFUseCase } from '#api/core/application/CreateEntityFromPDF.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { MongoEntitiesDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';

type CreateSutProps = {
  body?: CreateEntityFromPDFRequest;
};

const createPDFFile = () =>
  new InputFile({
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: '/tmp',
    filename: 'test.pdf',
    path: '/tmp/test.pdf',
    size: 1024,
  });

const createSut = (props?: CreateSutProps) => {
  const response = TestUtils.mockClass<Response>({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  const request = TestUtils.mockClass<Request>({
    inputFile: props?.body?.file,
    body: props?.body,
    language: 'en',
  });

  const sut = new CreateEntityFromPDFController({ request, response });

  return { sut, request, response };
};

describe('CreateEntityFromPDFController', () => {
  const entityResult = { sharedId: 'test-shared-id', title: 'Test Entity' };
  let useCaseExecuteSpy: jest.Mock;

  beforeEach(() => {
    useCaseExecuteSpy = jest.fn().mockResolvedValue({ sharedId: 'test-shared-id' });

    jest.spyOn(CreateEntityFromPDFUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<CreateEntityFromPDFUseCase>({
        execute: useCaseExecuteSpy,
      })
    );

    jest.spyOn(EntitiesDAOFactory, 'default').mockReturnValue(
      TestUtils.mockClass<MongoEntitiesDAO>({
        getWithFiles: jest.fn().mockResolvedValue([entityResult]),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should execute use case with correct parameters', async () => {
    const file = createPDFFile();
    const { sut } = createSut({ body: { file, templateId: 'template-123' } });

    await sut.handleAsync();

    expect(useCaseExecuteSpy).toHaveBeenCalledWith({
      templateId: 'template-123',
      inputFile: file,
    });
  });

  it('should return 201 with created entity on success', async () => {
    const file = createPDFFile();
    const { sut, response } = createSut({ body: { file } });

    await sut.handleAsync();

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ data: entityResult });
  });

  describe.each([
    ['no file is provided', undefined],
    [
      'a non-PDF file is provided',
      new InputFile({
        fieldname: 'file',
        originalname: 'document.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        destination: '/tmp',
        filename: 'document.txt',
        path: '/tmp/document.txt',
        size: 512,
      }),
    ],
    [
      'an image file is provided',
      new InputFile({
        fieldname: 'file',
        originalname: 'photo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        destination: '/tmp',
        filename: 'photo.png',
        path: '/tmp/photo.png',
        size: 2048,
      }),
    ],
  ])('when %s', (_description, file) => {
    it('should throw a validation error matching snapshot', async () => {
      const { sut } = createSut({ body: { file: file as any } });

      await expect(sut.handleAsync()).rejects.toMatchSnapshot();
    });
  });
});
