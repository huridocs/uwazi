import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXExtractorsQueryServiceFactory } from '../infrastructure/PXExtractorsQueryServiceFactory';
import { EntityStatus } from '../domain/PXEntityStatusModel';

const RequestSchema = z.object({
  id: z.string({ message: 'You should provide the id of the extractor' }),
  page: z
    .object({
      number: z.number().int().optional(),
      size: z.number().int().optional(),
    })
    .optional(),
  filter: z.object({ status: z.array(z.nativeEnum(EntityStatus)).optional() }).optional(),
});

type Request = z.infer<typeof RequestSchema>;

type PXExtractorStatusesControllersProps = AbstractControllerDependencies<Request>;

class PXGetExtractorStatusesController extends AbstractController {
  queryService: PXExtractorsQueryService;

  constructor(dependencies: PXExtractorStatusesControllersProps) {
    super(dependencies);
    this.queryService = PXExtractorsQueryServiceFactory.createDefault();
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.query);
    const { language } = this;
    const output = await this.queryService.getExtractorStatuses({ ...dto, language });
    this.jsonResponse(output);
  }
}

export { PXGetExtractorStatusesController };
