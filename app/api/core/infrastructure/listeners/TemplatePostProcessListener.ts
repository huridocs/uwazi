import { TemplateMapper } from 'api/core/infrastructure/mongodb/template/Mapper';
import { EventsBus } from 'api/eventsbus';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import {
  TemplatePostProcessService,
  TemplatePostProcessServiceDeps,
} from '../../application/TemplatePostProcessService';

class TemplatePostProcessListener {
  constructor(
    private eventBus: EventsBus,
    private depsFactory: () => Promise<TemplatePostProcessServiceDeps>
  ) {}

  start() {
    this.eventBus.on(TemplateUpdatedEvent, this.onEvent.bind(this));
  }

  private async onEvent({ before, after, context }: TemplateUpdatedEvent['data']) {
    if (!context) {
      return;
    }

    const oldTemplate = TemplateMapper.toDomain(before as TemplateDBO);
    const newTemplate = TemplateMapper.toDomain(after as TemplateDBO);

    const deps = await this.depsFactory();
    const service = new TemplatePostProcessService(deps);

    await service.createJobsForEntities({ oldTemplate, newTemplate, context });
  }
}

export { TemplatePostProcessListener };
