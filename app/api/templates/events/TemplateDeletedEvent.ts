import { AbstractEvent } from '../../eventsbus/AbstractEvent.js';

interface TemplateDeletedData {
  templateId: string;
}

export class TemplateDeletedEvent extends AbstractEvent<TemplateDeletedData> {}
