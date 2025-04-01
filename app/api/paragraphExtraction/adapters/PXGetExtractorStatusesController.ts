import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

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
    const dto = RequestSchema.parse(this.request.query);
    const { language } = this;

    const useCase = await PXExtractorsStatusesFactory.createDefault();
    const output = await useCase.execute({ ...dto, language });
    this.jsonResponse(output);
  }
}

export { PXGetExtractorStatusesController };
