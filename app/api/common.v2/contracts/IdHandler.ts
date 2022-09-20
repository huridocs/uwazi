import { IdGenerator } from './IdGenerator';
import { IdMapper } from './IdMapper';

interface IdHandler<DbType> extends IdGenerator, IdMapper<DbType> {}

export type { IdHandler };
