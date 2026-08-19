import { z } from 'zod';
import * as cookie from 'cookie';
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
    const sessionId = cookie.parse(this.request.get('cookie') || '')['connect.sid'];
    const useCase = CreateEntityFromPDFUseCaseFactory.default({
      ...(sessionId ? { sessionId } : {}),
    });
    const output = await useCase.execute({ templateId: body.templateId, inputFile: body.file });
    const entitiesDAO = EntitiesDAOFactory.default();
    const [entityWithFiles] = await entitiesDAO.find(
      { sharedId: output.sharedId, language: this.language },
      { withFiles: true }
    );

    this.response.status(201).json({
      data: entityWithFiles as any as EntityWithFilesSchema,
    } satisfies CreateEntityFromPDFResponse);
  }
}

export { CreateEntityFromPDFController };
export type { Request as CreateEntityFromPDFRequest };
