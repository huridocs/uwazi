import { EventListenerRegistry } from '#api/core/libs/eventEmitter/EventListenerRegistry.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ListenerRegistration } from '../ListenerRegistration.js';

const registeredFor = (registry: EventListenerRegistry, eventName: string) =>
  [...(registry.getListeners(eventName) ?? [])].map(listener => listener.name).sort();

describe('ListenerRegistration', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('registerEvents', () => {
    it('should register the listeners of core and of every package, by event', () => {
      const registry = new EventListenerRegistry();

      ListenerRegistration.registerEvents(registry);

      expect(registeredFor(registry, 'SettingsChangedEvent')).toEqual([
        'BroadcastSettingsChanged',
        'QueueSegmentationsOnFeatureEnabled',
      ]);
      expect(registeredFor(registry, 'FileCreatedEvent')).toEqual(['SegmentOnFileCreated']);
      expect(registeredFor(registry, 'FileDeletedEvent')).toEqual([
        'DeleteSegmentationsOnFileDeleted',
      ]);
      expect(registeredFor(registry, 'LanguageAddedEvent')).toEqual(['AddLanguagePagesListener']);
      expect(registeredFor(registry, 'LanguageDeletedEvent')).toEqual([
        'DeleteLanguagePagesListener',
      ]);
      expect(registeredFor(registry, 'EntityUpdatedEvent')).toEqual([
        'ProcessRelationshipAfterEntityUpdatedListener',
      ]);
    });

    it('should be callable more than once on the same registry', () => {
      const registry = new EventListenerRegistry();

      ListenerRegistration.registerEvents(registry);

      expect(() => ListenerRegistration.registerEvents(registry)).not.toThrow();
      expect(registeredFor(registry, 'FileCreatedEvent')).toEqual(['SegmentOnFileCreated']);
    });
  });

  describe('registerJobs', () => {
    it('should register each listener job once, built by its own factory', async () => {
      const registered: { name: string; built: string }[] = [];

      await testingEnvironment.runWithContext(async () => {
        const jobs: { name: string; factory: (namespace: string) => Promise<object> }[] = [];
        ListenerRegistration.registerJobs((dispatchable, factory) => {
          jobs.push({ name: dispatchable.name, factory });
        });
        await Promise.all(
          jobs.map(async ({ name, factory }) => {
            registered.push({ name, built: (await factory('default')).constructor.name });
          })
        );
      });

      expect(registered.sort((a, b) => a.name.localeCompare(b.name))).toEqual([
        {
          name: 'EntityUpdatedEvent:ProcessRelationshipAfterEntityUpdatedListener',
          built: 'ProcessRelationshipAfterEntityUpdatedListener',
        },
        { name: 'FileCreatedEvent:SegmentOnFileCreated', built: 'SegmentOnFileCreated' },
        {
          name: 'FileDeletedEvent:DeleteSegmentationsOnFileDeleted',
          built: 'DeleteSegmentationsOnFileDeleted',
        },
        { name: 'LanguageAddedEvent:AddLanguagePagesListener', built: 'AddLanguagePagesListener' },
        {
          name: 'LanguageDeletedEvent:DeleteLanguagePagesListener',
          built: 'DeleteLanguagePagesListener',
        },
        {
          name: 'SettingsChangedEvent:BroadcastSettingsChanged',
          built: 'BroadcastSettingsChanged',
        },
        {
          name: 'SettingsChangedEvent:QueueSegmentationsOnFeatureEnabled',
          built: 'QueueSegmentationsOnFeatureEnabled',
        },
      ]);
    });
  });
});
