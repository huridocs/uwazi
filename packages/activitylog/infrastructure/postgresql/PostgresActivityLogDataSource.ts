import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { ActivityLogDataSource } from '../../application/contracts/ActivityLogDataSource.js';
import { ActivityLogEntry } from '../../domain/ActivityLogEntry.js';
import { PostgresActivityLogRow } from './PostgresActivityLogRow.js';

/**
 * The `activitylogs` table; tenant isolation is its row-level security policy. Entries carry no
 * expiry here: how many a tenant keeps is decided by count, not by age.
 */
class PostgresActivityLogDataSource
  extends PostgresDataSource<PostgresActivityLogRow>
  implements ActivityLogDataSource
{
  constructor(deps: PostgresDataSourceDeps) {
    super('activitylogs', deps);
  }

  async append({ props }: ActivityLogEntry): Promise<void> {
    await this.table.insert({
      _id: props.id,
      method: props.method,
      url: props.url,
      params: props.params,
      query: props.query,
      body: props.body,
      user_id: props.userId,
      username: props.username,
      time: props.time,
    });
  }
}

export { PostgresActivityLogDataSource };
