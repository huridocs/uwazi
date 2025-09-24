import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
  // @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
} from '../common.v2/infrastructure/AbstractController.js';

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
    // @ts-expect-error TS(2339): Property 'request' does not exist on type 'PXGetEn... Remove this comment to see the full error message
    const dto = RequestSchema.parse(this.request.query);

    const useCase = await PXEntityParagraphsFactory.createDefault();
    const output = await useCase.execute({ ...dto });
    // @ts-expect-error TS(2339): Property 'jsonResponse' does not exist on type 'PX... Remove this comment to see the full error message
    this.jsonResponse(output);
  }
}

export { PXGetEntityParagraphsController };
