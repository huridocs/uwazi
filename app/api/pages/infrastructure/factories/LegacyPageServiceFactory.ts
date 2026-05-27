import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { LegacyPageService } from '../mongodb/LegacyPageService.js';

type Overrides = { transactionManager?: TransactionManager };

export class LegacyPageServiceFactory {
  static default(overrides?: Overrides) {
    const pagesDS = PagesDataSourceFactory.default(overrides);
    return new LegacyPageService(pagesDS);
  }
}
