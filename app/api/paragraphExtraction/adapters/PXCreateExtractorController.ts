import { z } from 'zod';
import { AbstractController, Dependencies } from 'api/common.v2/infrastructure/AbstractController';
import { PXCreateExtractorFactory } from '../infrastructure/PXCreateExtractorFactory';

const RequestSchema = z.object({
  targetTemplateId: z.string({ message: 'You should provide a target template' }),
  sourceTemplateId: z.string({ message: 'You should provide a source template' }),
  paragraphPropertyId: z.string(),
  paragraphNumberPropertyId: z.string(),
  sourceRelationshipTypeId: z.string(),
  targetRelationshipTypeId: z.string(),
});

type RequestBodySchema = z.infer<typeof RequestSchema>;

interface ResponseBody {
  extractorId: string;
}

type ControllerDependencies = Dependencies<RequestBodySchema>;

class PXCreateExtractorController extends AbstractController<RequestBodySchema> {
  constructor(dependencies: ControllerDependencies) {
    super(dependencies);
  }

  protected async handle(): Promise<void> {
    const dto: RequestBodySchema = RequestSchema.parse(this.request.body);

    const useCase = await PXCreateExtractorFactory.createDefault({
      tenantName: this.tenantName,
    });

    const output = await useCase.execute(dto);

    const response: ResponseBody = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
