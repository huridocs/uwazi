import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { TemplateDeletedEvent } from '#api/core/domain/template/events/TemplateDeletedEvent.js';
import { TemplateUpdatedEvent } from '#api/core/domain/template/events/TemplateUpdatedEvent.js';
import { SettingsService } from '#api/core/application/settings/SettingsService.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type Dependencies = {
  settingsService: SettingsService;
  transactionManager: TransactionManager;
};

class ReconcileFiltersOnTemplateChange {
  constructor(
    private eventBus: EventsBus,
    private depsFactory: () => Dependencies
  ) {}

  private get deps() {
    return this.depsFactory();
  }

  start() {
    this.eventBus.on(TemplateDeletedEvent, this.onDeleted.bind(this));
    this.eventBus.on(TemplateUpdatedEvent, this.onUpdated.bind(this));
  }

  private async withTransaction(work: () => Promise<unknown>) {
    const { transactionManager } = this.deps;
    if (transactionManager.isRunning()) {
      await work();
      return;
    }
    await transactionManager.run(work);
  }

  private async onDeleted({ templateId }: TemplateDeletedEvent['data']) {
    await this.withTransaction(async () =>
      this.deps.settingsService.removeTemplateFromFilters(templateId)
    );
  }

  private async onUpdated({ before, after }: TemplateUpdatedEvent['data']) {
    if (before.name === after.name || after._id === undefined) {
      return;
    }
    await this.withTransaction(async () =>
      this.deps.settingsService.updateFilterName(String(after._id), after.name)
    );
  }
}

export { ReconcileFiltersOnTemplateChange };
export type { Dependencies as ReconcileFiltersOnTemplateChangeDeps };
