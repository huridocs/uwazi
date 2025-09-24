import { z } from 'zod';
import {
  AbstractController,
  Dependencies,
  // @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
} from '../common.v2/infrastructure/AbstractController.js';
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
    // @ts-expect-error TS(2339): Property 'request' does not exist on type 'PXCreat... Remove this comment to see the full error message
    const dto: RequestBodySchema = RequestSchema.parse(this.request.body);

    const useCase = await PXCreateExtractorFactory.createDefault({
      // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'PXCr... Remove this comment to see the full error message
      tenantName: this.tenantName,
    });

    const output = await useCase.execute(dto);

    const response: ResponseBody = {
      extractorId: output.id,
    };

    // @ts-expect-error TS(2339): Property 'jsonResponse' does not exist on type 'PX... Remove this comment to see the full error message
    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
