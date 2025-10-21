import { EventsBus } from 'api/core/libs/eventsbus';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { TestUtils } from 'api/common.v2/utils/Test';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
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
