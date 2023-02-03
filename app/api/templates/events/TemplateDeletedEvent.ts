import { AbstractEvent } from 'api/eventsbus/AbstractEvent';

interface TemplateDeletedData {
  templateId: string;
}

export class TemplateDeletedEvent extends AbstractEvent<TemplateDeletedData> {}
