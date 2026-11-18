import { GetPageController } from '#api/pages.v2/infrastructure/http/GetPageController.js';
import { ListPagesController } from '#api/pages.v2/infrastructure/http/ListPagesController.js';

import type { PagesResource } from '../../application/ServerApiClient.js';
import type {
  PageQuery,
  PageResponse,
  PagesQuery,
  PagesResponse,
} from '../../application/contracts/Pages.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class PagesClient implements PagesResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async list(query: PagesQuery = {}) {
    return this.invoker.invoke<PagesResponse>(ListPagesController, query);
  }

  async get(query: PageQuery) {
    return this.invoker.invoke<PageResponse>(GetPageController, query);
  }
}

export { PagesClient };
