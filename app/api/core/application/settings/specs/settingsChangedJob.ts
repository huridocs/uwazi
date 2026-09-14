import type { Db } from 'mongodb';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { BroadcastSettingsChanged } from '#api/core/infrastructure/listeners/BroadcastSettingsChanged.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import type { Listener } from '#api/core/libs/eventEmitter/Listener.js';

const SETTINGS_CHANGED_JOB_NAME = BroadcastSettingsChanged.asJob().name;

const ensureBroadcastSettingsChangedRegistered = () => {
  const listeners = EventEmitterFactory.registry.getListeners(SettingsChangedEvent.name);
  const alreadyRegistered = Boolean(
    listeners && Array.from(listeners).includes(BroadcastSettingsChanged as typeof Listener)
  );
  if (!alreadyRegistered) {
    EventEmitterFactory.registry.register(BroadcastSettingsChanged);
  }
};

const jobsCollection = (db: Db) => db.collection('jobs');

const clearJobs = async (db: Db = getConnection()) => {
  await jobsCollection(db).deleteMany({});
};

const expectSettingsChangedJob = async (db: Db = getConnection()) => {
  const jobs = await jobsCollection(db).find().toArray();
  expect(jobs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        queue: 'uwazi_jobs',
        name: SETTINGS_CHANGED_JOB_NAME,
      }),
    ])
  );
};

export { clearJobs, ensureBroadcastSettingsChangedRegistered, expectSettingsChangedJob };
