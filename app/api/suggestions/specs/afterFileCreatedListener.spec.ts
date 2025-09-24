// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../files/events/FileUpdatedEve... Remove this comment to see the full error message
import { FileUpdatedEvent } from '../files/events/FileUpdatedEvent.js';

import { getFixturesFactory } from 'api/utils/fixturesFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Test.js' or... Remove this comment to see the full error message
import { TestUtils } from '../common.v2/utils/Test.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/MockL... Remove this comment to see the full error message
import { createMockLogger } from '../log.v2/infrastructure/MockLogger.js';
import { AfterFileUpdatedListener } from '../listeners/afterFileCreatedListener';
import { CreateBlankSuggestionsFromDocument } from '../useCases/createBlankSuggestionsFromDocument';
import { ExtractorsNotAvailableError } from '../ixValidationError';

const factory = getFixturesFactory();

type Props = {
  settingsDS?: SettingsDataSource;
  createBlankSuggestionsFromDocument?: CreateBlankSuggestionsFromDocument;
};

const createSut = (props?: Props) => {
  const eventBus = new EventsBus();
  const createBlankSuggestionsFromDocument =
    props?.createBlankSuggestionsFromDocument ??
    TestUtils.mockClass<CreateBlankSuggestionsFromDocument>({ execute: jest.fn() });

  const settingsDS =
    props?.settingsDS ??
    TestUtils.mockClass<SettingsDataSource>({
      get: jest.fn().mockResolvedValue({ features: { metadataExtraction: { url: 'any_url' } } }),
    });

  new AfterFileUpdatedListener(eventBus, () => ({
    eventBus,
    settingsDS,
    createBlankSuggestionsFromDocument,
    logger: createMockLogger(),
  })).start();

  return {
    createBlankSuggestionsFromDocument,
    eventBus,
  };
};

describe('AfterFileUpdatedListener', () => {
  describe('when Document is created', () => {
    it('should call CreateBlankSuggestionsFromDocument with correct params', async () => {
      const { createBlankSuggestionsFromDocument, eventBus } = createSut();
      const before = factory.document('document_1', {
        entity: 'entity_1',
        status: 'processing',
      });

      const after = factory.document('document_1', {
        entity: 'entity_1',
        language: 'en',
        status: 'ready',
      });

      await eventBus.emit(new FileUpdatedEvent({ before, after }));

      expect(createBlankSuggestionsFromDocument.execute).toHaveBeenCalledWith({ file: after });
    });

    it('should not call CreateBlankSuggestionsFromDocument for Files different from Documents', async () => {
      const { createBlankSuggestionsFromDocument, eventBus } = createSut();
      const before = factory.file('file_1', {
        entity: 'entity_1',
        status: 'processing',
      });

      const after = factory.file('file_1', {
        entity: 'entity_1',
        language: 'en',
        status: 'ready',
      });

      await eventBus.emit(new FileUpdatedEvent({ before, after }));

      expect(createBlankSuggestionsFromDocument.execute).not.toHaveBeenCalled();
    });

    it('should not call CreateBlankSuggestionsFromDocument when status transition is not valid', async () => {
      const { createBlankSuggestionsFromDocument, eventBus } = createSut();
      const before = factory.document('file_1', {
        entity: 'entity_1',
        status: 'ready',
        language: 'en',
        filename: 'a',
      });

      const after = factory.document('file_1', {
        entity: 'entity_1',
        status: 'ready',
        language: 'en',
        filename: 'b',
      });

      await eventBus.emit(new FileUpdatedEvent({ before, after }));

      expect(createBlankSuggestionsFromDocument.execute).not.toHaveBeenCalled();
    });

    it('should catch IXValidationError', async () => {
      const createBlankSuggestionsFromDocument =
        TestUtils.mockClass<CreateBlankSuggestionsFromDocument>({
          execute: jest.fn().mockRejectedValue(new ExtractorsNotAvailableError('any_template_id')),
        });

      const { eventBus } = createSut({
        createBlankSuggestionsFromDocument,
      });

      const before = factory.document('document_1', {
        entity: 'entity_1',
        status: 'processing',
      });

      const after = factory.document('document_1', {
        entity: 'entity_1',
        language: 'en',
        status: 'ready',
      });

      await expect(eventBus.emit(new FileUpdatedEvent({ before, after }))).resolves.not.toThrow();
    });

    it('should throw unexpected errors', async () => {
      const createBlankSuggestionsFromDocument =
        TestUtils.mockClass<CreateBlankSuggestionsFromDocument>({
          execute: jest.fn().mockRejectedValue(new Error('any_template_id')),
        });

      const { eventBus } = createSut({
        createBlankSuggestionsFromDocument,
      });

      const before = factory.document('document_1', {
        entity: 'entity_1',
        status: 'processing',
      });

      const after = factory.document('document_1', {
        entity: 'entity_1',
        language: 'en',
        status: 'ready',
      });

      await expect(eventBus.emit(new FileUpdatedEvent({ before, after }))).rejects.toThrow();
    });
  });

  it('should not call Use cases when feature flag is disabled', async () => {
    const settingsDS = TestUtils.mockClass<SettingsDataSource>({
      get: jest.fn().mockResolvedValue({ features: {} }),
    });

    const { createBlankSuggestionsFromDocument, eventBus } = createSut({ settingsDS });
    const before = factory.document('document_1', {
      entity: 'entity_1',
      status: 'processing',
    });

    const after = factory.document('document_1', {
      entity: 'entity_1',
      language: 'en',
      status: 'ready',
    });

    await eventBus.emit(new FileUpdatedEvent({ before, after }));

    expect(createBlankSuggestionsFromDocument.execute).not.toHaveBeenCalled();
  });

  it('should not call Use cases for documents not ready', async () => {
    const { createBlankSuggestionsFromDocument, eventBus } = createSut();
    const before = factory.document('file_1', {
      entity: 'entity_1',
      status: 'processing',
    });

    const after = factory.document('file_1', {
      entity: 'entity_1',
      status: 'processing',
      language: 'en',
    });

    await eventBus.emit(new FileUpdatedEvent({ before, after }));

    expect(createBlankSuggestionsFromDocument.execute).not.toHaveBeenCalled();
  });
});
