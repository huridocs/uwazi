import type { DatavizAppearance, DatavizDataDTO, DatavizQuery } from '#shared/types/datavizSchema.js';
import { User } from '#api/users.v2/model/User.js';

export type DatavizQueryContext = {
  actor: User;
  language: string;
  datavizId?: string;
  appearance?: DatavizAppearance;
  timeoutMs?: number;
};

export interface DatavizQueryExecutor {
  execute(query: DatavizQuery, context: DatavizQueryContext): Promise<DatavizDataDTO>;
}
