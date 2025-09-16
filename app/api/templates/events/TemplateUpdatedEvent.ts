import { AbstractEvent } from 'api/eventsbus';
import { TemplateSchema } from 'shared/types/templateType';

export interface TemplateUpdatedData {
  before: TemplateSchema;
  after: TemplateSchema;
}

export class TemplateUpdatedEvent extends AbstractEvent<TemplateUpdatedData> {}
