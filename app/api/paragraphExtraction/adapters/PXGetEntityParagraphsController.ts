import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXEntityParagraphsFactory } from '../infrastructure/PXEntityParagraphsFactory';

const RequestSchema = z.object({
  id: z.string({ message: 'You should provide the id (sharedId) of the entity' }),
  extractorId: z.string({ message: 'You should provide an Extractor' }),
  page: z
    .object({
      number: z.coerce.number().int().optional(),
      size: z.coerce.number().int().optional(),
    })
    .optional(),
});

type Request = z.infer<typeof RequestSchema>;

type PXGetEntityParagraphsControllerProps = AbstractControllerDependencies<Request>;

class PXGetEntityParagraphsController extends AbstractController {
  constructor(dependencies: PXGetEntityParagraphsControllerProps) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.query);

    const useCase = await PXEntityParagraphsFactory.createDefault();
    const output = await useCase.execute({ ...dto });
    this.jsonResponse(output);
  }
}

export { PXGetEntityParagraphsController };
