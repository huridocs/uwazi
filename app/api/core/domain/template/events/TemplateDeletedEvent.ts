import { AbstractEvent } from '#api/eventsbus/AbstractEvent.js';

interface TemplateDeletedData {
  templateId: string;
}

export class TemplateDeletedEvent extends AbstractEvent<TemplateDeletedData> {}
