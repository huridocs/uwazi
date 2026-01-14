import { AbstractEvent } from 'api/core/libs/eventsbus';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';

export type TemplateUpdatedEventContext = {
  fullReindex: boolean;
  language: LanguageISO6391;
  userId: string;
  tenantName: string;
};

export interface TemplateUpdatedData {
  before: TemplateSchema;
  after: TemplateSchema;
  context?: { fullReindex: boolean; language: LanguageISO6391; userId: string; tenantName: string };
}

export class TemplateUpdatedEvent extends AbstractEvent<TemplateUpdatedData> {}
