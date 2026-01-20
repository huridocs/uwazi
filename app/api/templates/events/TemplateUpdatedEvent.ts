import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { TemplateSchema } from '#shared/types/templateType.js';

export interface TemplateUpdatedData {
  before: TemplateSchema;
  after: TemplateSchema;
}

export class TemplateUpdatedEvent extends AbstractEvent<TemplateUpdatedData> {}
