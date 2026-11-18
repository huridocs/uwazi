import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { Authorize } from '#api/core/infrastructure/express/decorators/Authorize.js';
import { ValidateRequest } from '#api/core/infrastructure/express/decorators/ValidateRequest.js';
import { ActivityLogGetRequestSchema } from '#shared/types/activityLogApiSchemas.js';
import { ActivityLogQueryServiceFactory } from '../factories/ActivityLogQueryServiceFactory.js';
import type { ActivityLogResponse } from './ActivityLogResponse.js';
import { ActivityLogWireMapper } from './ActivityLogWireMapper.js';

/** Expects a query already decoded by `parseQuery`. */
class ListActivityLogController extends AbstractController {
  @Authorize(['admin'])
  @ValidateRequest(ActivityLogGetRequestSchema)
  protected async handle(): Promise<void> {
    const page = await ActivityLogQueryServiceFactory.default().list(
      ActivityLogWireMapper.toFilters(this.request.query)
    );
    const response: ActivityLogResponse = ActivityLogWireMapper.toResponse(page);
    this.jsonResponse(response);
  }
}

export { ListActivityLogController };
