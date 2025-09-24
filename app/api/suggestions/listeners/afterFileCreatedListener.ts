// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../files/events/FileUpdatedEve... Remove this comment to see the full error message
import { FileUpdatedEvent } from '../files/events/FileUpdatedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
import { inspect } from 'util';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/contracts/Logger.js'... Remove this comment to see the full error message
import { Logger } from '../log.v2/contracts/Logger.js';
import { CreateBlankSuggestionsFromDocument } from '../useCases/createBlankSuggestionsFromDocument';
import { IXValidationError } from '../ixValidationError';

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
