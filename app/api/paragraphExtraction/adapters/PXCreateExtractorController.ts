import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXCreateExtractor } from '../application/PXCreateExtractor';
import { PXCreateExtractorFactory } from '../infrastructure/PXCreateExtractorFactory';

const RequestSchema = z.object({
  targetTemplateId: z.string({ message: 'You should provide a target template' }),
  sourceTemplateId: z.string({ message: 'You should provide a source template' }),
  paragraphPropertyId: z.string(),
  paragraphNumberPropertyId: z.string(),
  sourceRelationshipTypeId: z.string(),
  targetRelationshipTypeId: z.string(),
});

type Request = z.infer<typeof RequestSchema>;

type Response = {
  extractorId: string;
};

type Dependencies = AbstractControllerDependencies<Request>;
class PXCreateExtractorController extends AbstractController {
  private useCase: PXCreateExtractor;

  constructor(dependencies: Dependencies) {
    super(dependencies);
    this.useCase = PXCreateExtractorFactory.createDefault();
  }

  protected async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    const output = await this.useCase.execute(dto);

    const response: Response = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
