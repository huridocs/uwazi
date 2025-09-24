import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
  // @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
} from '../common.v2/infrastructure/AbstractController.js';

import { EntityStatus } from '../domain/PXEntityStatusModel';
import { PXExtractorsStatusesFactory } from '../infrastructure/PXExtractorsStatusesFactory';

const RequestSchema = z.object({
  id: z.string({ message: 'You should provide the id of the extractor' }),
  page: z
    .object({
      number: z.coerce.number().int().optional(),
      size: z.coerce.number().int().optional(),
    })
    .optional(),
  filter: z.object({ status: z.array(z.nativeEnum(EntityStatus)).optional() }).optional(),
});

type Request = z.infer<typeof RequestSchema>;

type PXExtractorStatusesControllersProps = AbstractControllerDependencies<Request>;

class PXGetExtractorStatusesController extends AbstractController {
  constructor(dependencies: PXExtractorStatusesControllersProps) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    // @ts-expect-error TS(2339): Property 'request' does not exist on type 'PXGetEx... Remove this comment to see the full error message
    const dto = RequestSchema.parse(this.request.query);
    // @ts-expect-error TS(2339): Property 'language' does not exist on type 'PXGetE... Remove this comment to see the full error message
    const { language } = this;

    const useCase = await PXExtractorsStatusesFactory.createDefault();
    const output = await useCase.execute({ ...dto, language });
    // @ts-expect-error TS(2339): Property 'jsonResponse' does not exist on type 'PX... Remove this comment to see the full error message
    this.jsonResponse(output);
  }
}

export { PXGetExtractorStatusesController };
