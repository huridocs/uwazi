import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileUpdatedEvent } from '#api/files/events/FileUpdatedEvent.js';
import { FileType } from '#shared/types/fileType.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { inspect } from 'util';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { CreateBlankSuggestionsFromDocument } from '../useCases/createBlankSuggestionsFromDocument.js';
import { IXValidationError } from '../ixValidationError.js';

type Dependencies = {
  settingsDS: SettingsDataSource;
  createBlankSuggestionsFromDocument: CreateBlankSuggestionsFromDocument;
  logger: Logger;
};

export class AfterFileUpdatedListener {
  constructor(
    private eventBus: EventsBus,
    private depsFactory: () => Dependencies
  ) {}

  private get deps() {
    return this.depsFactory();
  }

  start() {
    this.eventBus.on(FileUpdatedEvent, this.onEvent.bind(this));
  }

  private async onEvent({ before, after }: FileUpdatedEvent['data']) {
    const settings = await this.deps.settingsDS.get();
    const isTransitionToReady = before.status !== 'ready' && after.status === 'ready';

    if (!settings.features?.metadataExtraction) return;

    if (after.type !== 'document' || after.status !== 'ready') return;

    if (!isTransitionToReady) return;

    await this.onFileCreated(after);
  }

  private async onFileCreated(file: FileType) {
    try {
      await this.deps.createBlankSuggestionsFromDocument.execute({ file });
    } catch (e) {
      this.deps.logger.info(inspect(e));
      if (e instanceof IXValidationError) return;

      throw e;
    }
  }
}
