import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractorEntitiesQueryService } from '../domain/PXExtractorEntitesQueryService';
import { PXExtractorEntitiesQueryServiceFactory } from '../infrastructure/PXExtractorEntitiesQueryServiceFactory';
import { EntityStatus } from '../domain/PXEntityStatusModel';

const RequestSchema = z.object({
  id: z.string({ message: 'You should provide the id of the extractor' }),
  page: z
    .object({
      number: z.number().int().optional(),
      size: z.number().int().optional(),
    })
    .optional(),
  filter: z.object({ status: z.nativeEnum(EntityStatus).optional() }).optional(),
});

type Request = z.infer<typeof RequestSchema>;

type PXExtractorEntitiesControllersProps = AbstractControllerDependencies<Request>;

class PXGetExtractorEntitiesController extends AbstractController {
  queryService: PXExtractorEntitiesQueryService;

  constructor(dependencies: PXExtractorEntitiesControllersProps) {
    super(dependencies);
    this.queryService = PXExtractorEntitiesQueryServiceFactory.createDefault();
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.query);
    const { language } = this;
    const output = await this.queryService.getExtractorEntities({ ...dto, language });
    this.jsonResponse(output);
  }
}

export { PXGetExtractorEntitiesController };
