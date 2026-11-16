import { GetSettingsController } from '#api/core/infrastructure/express/settings/GetSettingsController.js';
import { GetSettingsLinksController } from '#api/core/infrastructure/express/settings/GetSettingsLinksController.js';

import type { SettingsResource } from '../../application/ServerApiClient.js';
import type {
  SettingsLinksResponse,
  SettingsResponse,
} from '../../application/contracts/Settings.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class SettingsClient implements SettingsResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async get() {
    return this.invoker.invoke<SettingsResponse>(GetSettingsController, {
      method: 'GET',
      path: '/api/settings',
    });
  }

  async getLinks() {
    return this.invoker.invoke<SettingsLinksResponse>(GetSettingsLinksController, {
      method: 'GET',
      path: '/api/settings/links',
    });
  }
}

export { SettingsClient };
