import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ActivityLogQueryServiceFactory } from '../factories/ActivityLogQueryServiceFactory.js';
import type { ActivityLogResponse } from './ActivityLogResponse.js';
import { ActivityLogWireMapper } from './ActivityLogWireMapper.js';

/** The request has been validated against `ActivityLogGetRequestSchema` by the time it gets here. */
class ListActivityLogController extends AbstractController {
  protected async handle(): Promise<void> {
    const page = await ActivityLogQueryServiceFactory.default().list(
      ActivityLogWireMapper.toFilters(this.request.query)
    );
    const response: ActivityLogResponse = ActivityLogWireMapper.toResponse(page);
    this.jsonResponse(response);
  }
}

export { ListActivityLogController };
