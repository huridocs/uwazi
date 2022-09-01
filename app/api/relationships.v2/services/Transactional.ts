import { ClientSession } from 'mongodb';

export interface Transactional {
  setTransactionContext(session: ClientSession): void;
}
