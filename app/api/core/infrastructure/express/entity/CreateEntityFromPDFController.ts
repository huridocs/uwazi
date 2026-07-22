import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { InputFile } from '../../files/InputFile.js';
import { CreateEntityFromPDFUseCaseFactory } from '../../factories/CreateEntityFromPDFUseCaseFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { CreateEntityFromPDFResponse } from '#shared/contracts/Entities.js';
import { EntityWithFilesSchema } from '#shared/types/entityType.js';

const FileSchema = z
  .instanceof(InputFile, {
    message: 'File is required',
  })
  .refine(file => ['application/pdf'].includes(file.metadata.mimetype), {
    message: 'Invalid file type. Only PDF files are allowed.',
  });

const RequestBodySchema = z.object({
  templateId: z.coerce.string().optional(),
  file: FileSchema,
});

type Request = z.infer<typeof RequestBodySchema>;

class CreateEntityFromPDFController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const body = RequestBodySchema.parse({ ...this.request.body, file: this.request.inputFile });

    const useCase = CreateEntityFromPDFUseCaseFactory.default();

    const output = await useCase.execute({ templateId: body.templateId, inputFile: body.file });

    const entitiesDAO = EntitiesDAOFactory.default();

    const [entityWithFiles] = await entitiesDAO.getWithFiles({
      sharedId: output.sharedId,
      language: this.language,
    });

    const response: CreateEntityFromPDFResponse = {
      data: entityWithFiles as any as EntityWithFilesSchema,
    };

    this.response.status(201).json(response);
  }
}

export { CreateEntityFromPDFController };
export type { Request as CreateEntityFromPDFRequest };
