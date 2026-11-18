import { GetDatavizDefinitionController } from '#api/dataviz.v2/infrastructure/http/GetDatavizDefinitionController.js';
import { ListDatavizController } from '#api/dataviz.v2/infrastructure/http/ListDatavizController.js';

import type { DatavizResource } from '../../application/ServerApiClient.js';
import type {
  DatavizDefinitionResponse,
  DatavizListResponse,
} from '../../application/contracts/Dataviz.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class DatavizClient implements DatavizResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async list() {
    return this.invoker.invoke<DatavizListResponse>(ListDatavizController);
  }

  async getById(id: string) {
    return this.invoker.invoke<DatavizDefinitionResponse>(
      GetDatavizDefinitionController,
      {},
      { id }
    );
  }
}

export { DatavizClient };
