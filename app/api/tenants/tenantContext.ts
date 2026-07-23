import { config } from '#api/config.js';
import { handleError } from '#api/utils/index.js';
import { appContext } from '#api/utils/AppContext.js';
import { TenantDocument, TenantsModel, DBTenant, tenantsModel } from './tenantsModel.js';

type TenantFeatureFlags = keyof NonNullable<Required<Tenant>['featureFlags']>;

type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  activityLogs: string;
  domain: string;
  featureFlags?: {
    s3Storage?: boolean;
    esReplicas?: number;
    sync?: boolean;
    deactivateTestJob?: boolean;
    paragraphExtraction?: boolean;
    fileCacheHeaders?: boolean;
    themeCustomization?: boolean;
    newHeader?: boolean;
    v2Languages?: boolean;
    postgresThesauri?: boolean;
    postgresFiles?: boolean;
    postgresTemplates?: boolean;
    postgresEntities?: boolean;
    aiAssistant?: boolean;
    aiAssistantServiceUrl?: string;
    v2UsersCreate?: boolean;
    v2UsersDelete?: boolean;
    v2UsersGet?: boolean;
    v2UsersUpdate?: boolean;
  };
  globalMatomo?: { id: string; url: string };
  ciMatomoActive?: boolean;
  maintenance?: boolean;
  telemetry?: {
    enabled?: boolean;
    thresholdMs?: number;
  };
  metricsConfig?: {
    enabled?: boolean;
    sampleRate?: number;
  };
};

class Tenants {
  tenants: { [k: string]: Tenant };

  defaultTenant: Tenant;

  model?: TenantsModel;

  constructor(defaultTenant: Tenant) {
    this.defaultTenant = defaultTenant;
    this.tenants = {
      [config.defaultTenant.name]: defaultTenant,
    };
  }

  async setupTenants(_model?: TenantsModel) {
    let model = _model;
    if (!model) {
      model = await tenantsModel();
    }
    this.model = model;
    this.model.on('change', () => {
      this.updateTenants(model).catch(handleError);
    });
    await this.updateTenants(this.model);
  }

  async tearDownTenants() {
    await this.model?.closeChangeStream();
  }

  async updateTenants(model: TenantsModel) {
    const tenants = await model.get();

    tenants.forEach((tenant: TenantDocument) => {
      this.add(tenant);
    });
  }

  /**
   * This is a proxy to the context run method using only the tenant information.
   * It is here for backwards compatibility after refactoring.
   * @param cb The callback to run in the context
   * @param tenantName Tenant name
   */
  // eslint-disable-next-line class-methods-use-this
  async run(
    cb: () => Promise<void>,
    tenantName: string = config.defaultTenant.name
  ): Promise<void> {
    return appContext.run(cb, {
      tenant: tenantName,
    });
  }

  current() {
    const tenantName = <string>appContext.get('tenant');

    if (!tenantName) {
      throw new Error('There is no tenant on the current async context');
    }
    if (!this.tenants[tenantName]) {
      throw new Error(
        `the tenant set to run the current async context -> [${tenantName}] its not available in the current process`
      );
    }
    return this.tenants[tenantName];
  }

  add(tenant: DBTenant) {
    this.tenants[tenant.name] = {
      ...this.defaultTenant,
      ...tenant,
      featureFlags: { ...this.defaultTenant.featureFlags, ...tenant.featureFlags },
      telemetry: { ...this.defaultTenant.telemetry, ...tenant.telemetry },
      metricsConfig: { ...this.defaultTenant.metricsConfig, ...tenant.metricsConfig },
    };
  }

  getTenantsForFeatureFlag(featureFlag: TenantFeatureFlags) {
    return Object.values(this.tenants).filter(tenant => tenant?.featureFlags?.[featureFlag]);
  }

  async setMaintenance(tenantName: string, maintenance: boolean) {
    if (this.model) {
      await this.model.setMaintenance(tenantName, maintenance);
    }
    if (this.tenants[tenantName]) {
      this.tenants[tenantName].maintenance = maintenance;
    }
  }

  async setTelemetryConfig(
    tenantName: string,
    telemetry: { enabled: boolean; thresholdMs: number }
  ) {
    if (this.model) {
      await this.model.setTelemetryConfig(tenantName, telemetry);
    }
    if (this.tenants[tenantName]) {
      this.tenants[tenantName].telemetry = telemetry;
    }
  }

  async setMetricsConfig(
    tenantName: string,
    metricsConfig: { enabled: boolean; sampleRate: number }
  ) {
    if (this.model) {
      await this.model.setMetricsConfig(tenantName, metricsConfig);
    }
    if (this.tenants[tenantName]) {
      this.tenants[tenantName].metricsConfig = metricsConfig;
    }
  }
}

const tenants = new Tenants(config.defaultTenant);
export { tenants, Tenants };
export type { Tenant, TenantFeatureFlags };
