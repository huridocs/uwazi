import '#api/entities/index.js';
import urljoin from 'url-join';
import request from '#shared/JSONRequest.js';
import { SettingsSyncSchema } from '#shared/types/settingsType.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { tenants } from '#api/tenants/index.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { runInJobContext } from '#api/services/tasksmanager/runInJobContext.js';
import { handleError } from '#api/utils/handleError.js';
import { synchronizer } from './synchronizer.js';
import { createSyncConfig } from './syncConfig.js';
import syncsModel from './syncsModel.js';

const updateSyncs = async (name: string, collection: string, lastSync: number) =>
  syncsModel._updateMany({ name }, { $set: { [`lastSyncs.${collection}`]: lastSync } }, {});

async function createSyncIfNotExists(config: SettingsSyncSchema) {
  const syncs = await syncsModel.find({ name: config.name });
  if (syncs.length === 0) {
    await syncsModel.create([{ lastSyncs: {}, name: config.name, consecutiveFailures: 0 }]);
  }
}

const CONSECUTIVE_FAILURES_BEFORE_DISABLE = 5;

const resetConsecutiveFailures = async (name: string) => {
  await syncsModel._updateMany({ name }, { $set: { consecutiveFailures: 0 } }, {});
};

const disableConfigAndNotify = async (
  config: SettingsSyncSchema,
  error: unknown,
  consecutiveFailures: number
) => {
  const modifiedCount = await SettingsDataSourceFactory.default().deactivateSyncConfig(config.name);

  if (modifiedCount !== 1) {
    return;
  }

  const err = error instanceof Error ? error : new Error(String(error));
  LoggerFactory.default().error(
    `Sync disabled after ${consecutiveFailures} consecutive failures: ${err.message}`,
    {
      tenant: tenants.current().name,
      syncConfig: config.name,
      url: config.url,
      errorName: err.name,
      consecutiveFailures,
      notify: true,
    }
  );
};

const recordConfigFailure = async (config: SettingsSyncSchema, error: unknown) => {
  if (!config.name) {
    return;
  }

  const updated = await syncsModel.findOneAndUpdate(
    { name: config.name },
    {
      $inc: { consecutiveFailures: 1 },
      $setOnInsert: { lastSyncs: {}, name: config.name },
    },
    { upsert: true, new: true, lean: true }
  );

  const consecutiveFailures = updated?.consecutiveFailures ?? 0;
  if (consecutiveFailures < CONSECUTIVE_FAILURES_BEFORE_DISABLE) {
    return;
  }

  await disableConfigAndNotify(config, error, consecutiveFailures);
};

class InvalidSyncConfig extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSyncConfig';
  }
}

interface SyncConfig {
  url: string;
  username: string;
  active?: boolean;
  password: string;
  name: string;
  config: {
    templates?: {
      [k: string]: {
        properties: string[];
        filter?: string;
        attachments?: boolean;
      };
    };
    relationtypes?: string[];
  };
}

const validateConfig = (config: SettingsSyncSchema) => {
  if (!config.name) throw new InvalidSyncConfig('Name is not defined on sync config');
  if (!config.url) throw new InvalidSyncConfig('url is not defined on sync config');
  if (!config.config) throw new InvalidSyncConfig('config is not defined on sync config');
  return config as SyncConfig;
};

const reportSyncFailure = (
  error: unknown,
  context: { tenant: string; syncConfig?: string; url?: string }
) => {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    LoggerFactory.default().error(`Sync failed: ${err.message}`, {
      tenant: context.tenant,
      syncConfig: context.syncConfig,
      url: context.url,
      errorName: err.name,
    });
    handleError(error);
  } catch (reportingError) {
    handleError(reportingError, { useContext: false });
  }
};

export const syncWorker = {
  UPDATE_LOG_TARGET_COUNT: 50,
  CONSECUTIVE_FAILURES_BEFORE_DISABLE,

  async runAllTenants() {
    return tenants.getTenantsForFeatureFlag('sync').reduce(async (previous, tenant) => {
      await previous;
      try {
        await runInJobContext(tenant.name, async () => {
          try {
            permissionsContext.setCommandContext();
            const stored = await SettingsDataSourceFactory.default().find();
            if (stored?.sync) {
              await this.syncronize(stored.sync);
            }
          } catch (error) {
            reportSyncFailure(error, { tenant: tenant.name });
          }
        });
      } catch (error) {
        handleError(error, { useContext: false });
      }
    }, Promise.resolve());
  },

  async syncronize(syncSettings: SettingsSyncSchema[]) {
    await syncSettings.reduce(async (previousSync, config) => {
      await previousSync;
      try {
        const syncConfig = validateConfig(config);
        if (!syncConfig?.active) return;

        await this.syncronizeConfig(syncConfig);
        await resetConsecutiveFailures(syncConfig.name);
      } catch (error) {
        reportSyncFailure(error, {
          tenant: tenants.current().name,
          syncConfig: config.name,
          url: config.url,
        });
        try {
          await recordConfigFailure(config, error);
        } catch (recordingError) {
          handleError(recordingError, { useContext: false });
        }
      }
    }, Promise.resolve());
  },

  async syncronizeConfig(config: SyncConfig) {
    await createSyncIfNotExists(config);

    const syncConfig = await createSyncConfig(config, config.name, this.UPDATE_LOG_TARGET_COUNT);

    const lastChanges = await syncConfig.lastChanges();

    if (lastChanges.length) {
      const cookie = await this.login(config);

      await lastChanges.reduce(async (previousChange, change) => {
        await previousChange;
        const shouldSync: { skip?: boolean; data?: any } = await syncConfig.shouldSync(change);
        if (shouldSync.skip) {
          await synchronizer.syncDelete(change, config.url, cookie);
        }

        if (shouldSync.data) {
          await synchronizer.syncData(
            {
              url: config.url,
              change,
              data: shouldSync.data,
              cookie,
            },
            'post'
          );
        }
        await updateSyncs(config.name, change.namespace, change.timestamp);
      }, Promise.resolve());
    }
  },

  async login({ url, username, password }: SyncConfig) {
    const response = await request.post(urljoin(url, 'api/login'), { username, password });

    return response.cookie || '';
  },
};

export type { SyncConfig };
