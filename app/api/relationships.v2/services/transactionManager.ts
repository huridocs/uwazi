import { ClientSession } from 'mongodb';

export interface TransactionManager {
  run<T>(callback: (session: ClientSession) => Promise<T>): Promise<T>;
}
