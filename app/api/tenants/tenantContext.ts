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
    featureFlagEntityViewerv2?: boolean;
    postgresThesauri?: boolean;
    postgresFiles?: boolean;
    postgresTemplates?: boolean;
    postgresEntities?: boolean;
    postgresRelationshipTypes?: boolean;
    postgresTranslations?: boolean;
    postgresPasswordRecoveries?: boolean;
    postgresUsers?: boolean;
    postgresCaptchas?: boolean;
    postgresUsergroups?: boolean;
    aiAssistant?: boolean;
    aiAssistantServiceUrl?: string;
    usersDirectory?: boolean;
    telemetry?: {
      enabled?: boolean;
      sampleRate?: number;
    };
    prometheus?: {
      enabled?: boolean;
      sampleRate?: number;
    };
  };
  globalMatomo?: { id: string; url: string };
  ciMatomoActive?: boolean;
  maintenance?: boolean;
};

class Tenants {
  tenants: { [k: string]: Tenant };

  defaultTenant: Tenant;

  model?: TenantsModel;

  constructor(defaultTenant: Tenant) {
    this.defaultTenant = defaultTenant;
    this.tenants = this.defaultTenantMap();
  }

  private defaultTenantMap(): { [k: string]: Tenant } {
    return {
      [this.defaultTenant.name]: this.defaultTenant,
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
    const tenantsFromDb = await model.get();
    if (tenantsFromDb.length === 0) {
      this.tenants = this.defaultTenantMap();
      return;
    }

    this.tenants = {};
    tenantsFromDb.forEach((tenant: TenantDocument) => {
      this.add(tenant);
    });
  }

  /**
   * This is a proxy to the context run method using only the tenant information.
   * It is here for backwards compatibility after refactoring.
   * @param cb The callback to run in the context
   * @param tenant Tenant name, or a Tenant instance (used for the privileged queue wrap)
   */
  // eslint-disable-next-line class-methods-use-this
  async run(
    cb: () => Promise<void>,
    tenant: string | Tenant = config.defaultTenant.name
  ): Promise<void> {
    if (typeof tenant !== 'string') {
      return appContext.run(cb, { tenantInstance: tenant });
    }
    return appContext.run(cb, {
      tenant,
    });
  }

  current() {
    const tenantInstance = appContext.get('tenantInstance') as Tenant | undefined;
    if (tenantInstance) {
      return tenantInstance;
    }

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
      featureFlags: {
        ...this.defaultTenant.featureFlags,
        ...tenant.featureFlags,
        telemetry: {
          ...this.defaultTenant.featureFlags?.telemetry,
          ...tenant.featureFlags?.telemetry,
        },
        prometheus: {
          ...this.defaultTenant.featureFlags?.prometheus,
          ...tenant.featureFlags?.prometheus,
        },
      },
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
    telemetry: { enabled: boolean; sampleRate: number }
  ) {
    if (this.model) {
      await this.model.setTelemetryConfig(tenantName, telemetry);
    }
    if (this.tenants[tenantName]) {
      this.tenants[tenantName].featureFlags = {
        ...this.tenants[tenantName].featureFlags,
        telemetry,
      };
    }
  }

  async setPrometheusConfig(
    tenantName: string,
    prometheus: { enabled: boolean; sampleRate: number }
  ) {
    if (this.model) {
      await this.model.setPrometheusConfig(tenantName, prometheus);
    }
    if (this.tenants[tenantName]) {
      this.tenants[tenantName].featureFlags = {
        ...this.tenants[tenantName].featureFlags,
        prometheus,
      };
    }
  }
}

const tenants = new Tenants(config.defaultTenant);
export { tenants, Tenants };
export type { Tenant, TenantFeatureFlags };
