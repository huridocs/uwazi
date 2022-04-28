import 'isomorphic-fetch';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import request from 'shared/JSONRequest';
import entities from 'api/entities';
import { Settings } from 'shared/types/settingsType';
import { EntitySchema } from 'shared/types/entityType';

const preserveSync = {
  async syncAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return tenants.run(async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.preserve');
        return this.sync(features);
      }, tenantName);
    }, Promise.resolve());
  },

  async sync(features: Settings['features']) {
    if (features?.preserve) {
      const config = features.preserve;
      const evidences = await request.get(
        `${config.host}/api/evidences`,
        {},
        {
          Authorization: config.token,
        }
      );

      await evidences.json.reduce(async (previous: Promise<EntitySchema>, evidence: any) => {
        await previous;
        await entities.save(
          { title: evidence.attributes.title, template: config.template },
          { language: 'en', user: {} }
        );
      }, Promise.resolve());
    }
  },
};

export { preserveSync };
