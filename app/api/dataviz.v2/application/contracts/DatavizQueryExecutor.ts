import type {
  DatavizAppearance,
  DatavizDataDTO,
  DatavizFilter,
  DatavizQuery,
} from '#shared/types/datavizSchema.js';
import { User } from '#api/users.v2/model/User.js';

export type DatavizQueryContext = {
  actor: User;
  datavizId?: string;
  appearance?: DatavizAppearance;
  externalFilters?: DatavizFilter[];
  timeoutMs?: number;
};

export interface DatavizQueryExecutor {
  execute(query: DatavizQuery, context: DatavizQueryContext): Promise<DatavizDataDTO>;
}
