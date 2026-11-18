import { GetTemplatesController } from '#api/core/infrastructure/express/template/GetTemplatesController.js';

import type { TemplatesResource } from '../../application/ServerApiClient.js';
import type { TemplatesResponse } from '../../application/contracts/Templates.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class TemplatesClient implements TemplatesResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getAll() {
    return this.invoker.invoke<TemplatesResponse>(GetTemplatesController);
  }
}

export { TemplatesClient };
