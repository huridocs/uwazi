import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Settings, SettingsFilterSchema } from '#shared/types/settingsType.js';
import { removeTemplateFromFilters, renameFilter } from './libraryFilters.js';
import { SettingsTranslationService } from './SettingsTranslationService.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translations: SettingsTranslationService;
  transactionManager: TransactionManager;
  eventEmitter: EventEmitter;
};

class SettingsService {
  constructor(private deps: Deps) {}

  private ensureTransaction() {
    if (!this.deps.transactionManager.isRunning()) {
      throw new Error('This operation must be called within a transaction');
    }
  }

  async save(incoming: Settings, current: Settings) {
    this.ensureTransaction();
    await this.deps.translations.reconcile(incoming, current);
    const saved = await this.deps.settingsDS.patch(incoming);
    await this.deps.eventEmitter.emit(new SettingsChangedEvent({}));
    return saved;
  }

  async saveFilters(filters: SettingsFilterSchema[]) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    await this.deps.translations.reconcileFilters(filters, current.filters);
    const saved = await this.deps.settingsDS.patch({ filters });
    await this.deps.eventEmitter.emit(new SettingsChangedEvent({}));
    return saved;
  }

  async updateFilterName(filterId: ObjectIdSchema, name: string) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    const filters = renameFilter(current.filters || [], filterId, name);
    if (!filters) {
      return false;
    }
    await this.saveFilters(filters);
    return true;
  }

  async removeTemplateFromFilters(templateId: ObjectIdSchema) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    if (!current.filters) {
      return false;
    }
    await this.saveFilters(removeTemplateFromFilters(current.filters, templateId));
    return true;
  }
}

export { SettingsService };
export type { Deps as SettingsServiceDeps };
