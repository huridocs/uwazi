import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { QueueAdapter, QueueMessage } from './QueueAdapter';

export class MongoQueueAdapter extends MongoDataSource implements QueueAdapter {
  protected collectionName = 'jobs';

  async createQueueAsync(): Promise<1> {
    // Not needed
    return 1;
  }

  async changeMessageVisibilityAsync(options: {
    qname: string;
    id: string;
    vt: number;
  }): Promise<0 | 1> {
    const result = await this.getCollection().findOneAndUpdate(
      {
        queue: options.qname,
        _id: new ObjectId(options.id),
      },
      { $set: { lockedUntil: Date.now() + options.vt * 1000 } }
    );

    return result.ok;
  }

  async deleteMessageAsync(options: { qname: string; id: string }): Promise<0 | 1> {
    const result = await this.getCollection().findOneAndDelete({
      queue: options.qname,
      _id: new ObjectId(options.id),
    });

    return result.ok;
  }

  async receiveMessageAsync(options: { qname: string }): Promise<{} | QueueMessage> {
    const result = await this.getCollection().findOneAndUpdate(
      { queue: options.qname, lockedUntil: { $lt: Date.now() } },
      { $set: { lockedUntil: Date.now() + 10 } },
      { sort: { createdAt: -1 } }
    );

    return result.value
      ? {
          id: result.value._id.toHexString(),
          message: result.value.message,
        }
      : {};
  }

  async sendMessageAsync(options: { qname: string; message: string }): Promise<string> {
    const result = await this.getCollection().insertOne({
      queue: options.qname,
      message: options.message,
      lockedUntil: 0,
      createdAt: Date.now(),
    });

    return result.insertedId.toHexString();
  }
}
