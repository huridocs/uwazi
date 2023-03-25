import { AbstractEvent } from 'api/eventsbus';
import { TemplateSchema } from 'shared/types/templateType';

interface TemplateUpdatedData {
  before: TemplateSchema;
  after: TemplateSchema;
}

export class TemplateUpdatedEvent extends AbstractEvent<TemplateUpdatedData> {}
