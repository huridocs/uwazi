import { Db } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/data_sour... Remove this comment to see the full error message
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';

import { PXGetExtractorStatuses } from '../application/PXGetExtractorStatuses';
import { PXExtractorsQueryServiceFactory } from './PXExtractorsQueryServiceFactory';

type Props = {
  connection?: Db;
  mongoTransactionManager?: MongoTransactionManager;
};

export class PXExtractorsStatusesFactory {
  static createDefault(props?: Props) {
    const db = props?.connection || getConnection();
    const transactionManager = props?.mongoTransactionManager || DefaultTransactionManager();

    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection: db,
      transactionManager,
    });

    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const filesDS = DefaultFilesDataSource(transactionManager);

    return new PXGetExtractorStatuses({ extractorsQueryService, settingsDS, filesDS });
  }
}
