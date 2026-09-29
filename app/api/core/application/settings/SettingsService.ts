import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType, SettingsFilterSchema } from '#shared/types/settingsType.js';
import { SettingsTranslationService } from './SettingsTranslationService.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translations: SettingsTranslationService;
  transactionManager: TransactionManager;
  eventEmitter: EventEmitter;
  idGenerator: IdGenerator;
};

class SettingsService {
  constructor(private deps: Deps) {}

  private ensureTransaction() {
    if (!this.deps.transactionManager.isRunning()) {
      throw new Error('This operation must be called within a transaction');
    }
  }

  async save(incoming: SettingsType, current: Settings) {
    this.ensureTransaction();
    await this.deps.translations.reconcile(incoming, current.toState());
    current.apply(incoming, () => this.deps.idGenerator.generate());
    const saved = await this.deps.settingsDS.update(current);
    await this.deps.eventEmitter.emit(new SettingsChangedEvent({}));
    return saved;
  }

  async saveFilters(filters: SettingsFilterSchema[]) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    await this.deps.translations.reconcileFilters(filters, current.filters);
    current.apply({ filters }, () => this.deps.idGenerator.generate());
    const saved = await this.deps.settingsDS.update(current);
    await this.deps.eventEmitter.emit(new SettingsChangedEvent({}));
    return saved;
  }

  async updateFilterName(filterId: ObjectIdSchema, name: string) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    if (!current.renameFilter(filterId, name)) {
      return false;
    }
    await this.saveFilters(current.filters ?? []);
    return true;
  }

  async removeTemplateFromFilters(templateId: ObjectIdSchema) {
    this.ensureTransaction();
    const current = await this.deps.settingsDS.get();
    if (!current.removeTemplateFromFilters(templateId)) {
      return false;
    }
    await this.saveFilters(current.filters ?? []);
    return true;
  }
}

export { SettingsService };
export type { Deps as SettingsServiceDeps };
