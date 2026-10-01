import { EventEmitter } from 'events';
import { handleError } from '#api/utils/index.js';
import { TENANT_FIELDS } from './tenant.js';
import type { TenantsDataSource } from './application/contracts/TenantsDataSource.js';
import type { TenantsChangeFeed } from './application/contracts/TenantsChangeFeed.js';
import { TenantsDataSourceFactory } from './infrastructure/TenantsDataSourceFactory.js';
import { TenantsChangeFeedFactory } from './infrastructure/TenantsChangeFeedFactory.js';

import type { Tenant } from './tenant.js';

type DBTenant = Partial<Tenant> & { name: string };

/** Keeps operational data written by other tools out of the running process. */
const toTenant = (record: Record<string, unknown>): DBTenant =>
  Object.fromEntries(
    TENANT_FIELDS.filter(field => record[field] !== undefined).map(field => [field, record[field]])
  ) as DBTenant;

class TenantsModel extends EventEmitter {
  private debounceTimer?: NodeJS.Timeout;

  private pendingChanges = false;

  private dataSource: TenantsDataSource;

  private feed: TenantsChangeFeed;

  constructor(
    dataSource: TenantsDataSource = TenantsDataSourceFactory.default(),
    feed: TenantsChangeFeed = TenantsChangeFeedFactory.default()
  ) {
    super();
    this.dataSource = dataSource;
    this.feed = feed;
  }

  async initialize() {
    await this.feed.start(() => this.scheduleReload(), handleError);
  }

  async closeChangeStream() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    await this.feed.stop();
  }

  async change() {
    const tenants = await this.get();
    this.emit('change', tenants);
  }

  async get() {
    return (await this.dataSource.all()).map(toTenant);
  }

  private scheduleReload() {
    this.pendingChanges = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (!this.pendingChanges) {
        return;
      }
      this.pendingChanges = false;
      // Nothing awaits this timer, so a failed reload is reported rather than left to reject in
      // the background: the connection may well be gone by the time it fires.
      this.change().catch(handleError);
    }, 1000);
  }

  async setMaintenance(tenantName: string, maintenance: boolean) {
    await this.dataSource.upsert(tenantName, { maintenance });
  }

  async setTelemetryConfig(
    tenantName: string,
    telemetry: { enabled: boolean; sampleRate: number }
  ) {
    await this.dataSource.upsert(tenantName, { featureFlags: { telemetry } });
  }

  async setPrometheusConfig(
    tenantName: string,
    prometheus: { enabled: boolean; sampleRate: number }
  ) {
    await this.dataSource.upsert(tenantName, { featureFlags: { prometheus } });
  }
}

const tenantsModel = async () => {
  const model = new TenantsModel();
  if (process.env.NODE_ENV !== 'test') {
    await model.initialize();
  }
  return model;
};

export { TenantsModel, tenantsModel };
export type { DBTenant };
