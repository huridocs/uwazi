import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';

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
