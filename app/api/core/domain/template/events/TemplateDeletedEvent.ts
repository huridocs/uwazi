import { AbstractEvent } from 'api/core/libs/eventsbus/AbstractEvent';

interface TemplateDeletedData {
  templateId: string;
}

export class TemplateDeletedEvent extends AbstractEvent<TemplateDeletedData> {}
