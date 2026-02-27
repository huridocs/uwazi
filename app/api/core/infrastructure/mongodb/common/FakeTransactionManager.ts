import { MongoTransactionManager } from './MongoTransactionManager.js';

export class FakeMongoTransactionManager extends MongoTransactionManager {
  async run<T>(callback: () => Promise<T>) {
    const result = await callback();
    await this.executeOnCommitHandlers(result);
    return result;
  }
}
