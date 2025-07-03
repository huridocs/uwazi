import { EventsBus } from 'api/eventsbus';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { FileType } from 'shared/types/fileType';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { isEqual } from 'lodash';
import { inspect } from 'util';
import { Logger } from 'api/log.v2/contracts/Logger';
import { CreateBlankSuggestionsFromDocument } from '../useCases/createBlankSuggestionsFromDocument';
import { IXValidationError } from '../ixValidationError';

type Dependencies = {
  settingsDS: SettingsDataSource;
  createBlankSuggestionsFromDocument: CreateBlankSuggestionsFromDocument;
  updateSuggestionsState: (query: any) => Promise<void>;
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
    if (!settings.features?.metadataExtraction) {
      return;
    }

    const isTransitionToReady = before.status !== 'ready' && after.status === 'ready';

    if (after.type !== 'document' || after.status !== 'ready') {
      return;
    }

    if (isTransitionToReady) {
      await this.onFileCreated(after);
    } else {
      await this.onFileUpdated({ before, after });
    }
  }

  private async onFileCreated(file: FileType) {
    try {
      await this.deps.createBlankSuggestionsFromDocument.execute({ file });
    } catch (e) {
      this.deps.logger.info(inspect(e));
      if (e instanceof IXValidationError) {
        return;
      }

      throw e;
    }
  }

  private async onFileUpdated({ before, after }: FileUpdatedEvent['data']) {
    const _isEqual = isEqual(before.extractedMetadata, after.extractedMetadata);
    if (_isEqual) {
      return;
    }

    await this.deps.updateSuggestionsState({ fileId: after._id });
  }
}
