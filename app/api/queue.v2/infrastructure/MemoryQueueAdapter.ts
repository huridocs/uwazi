/* eslint-disable max-classes-per-file */
import { QueueAdapter } from 'api/queue.v2/infrastructure/QueueAdapter';

interface Queue {
  vt0: number;
  lastId: number;
  data: { id: string; message: string; vt: number }[];
}

class QueueExistsError extends Error {
  name = 'queueExists';
}
/**
 * This QueueAdapter is used for testing without connectiong to an external
 * storage (e.g. Redis). It's also a specification for the semantics of
 * a QueueAdapter.
 */
export class MemoryQueueAdapter implements QueueAdapter {
  private queues: Record<string, Queue> = {};

  async createQueueAsync({ qname, vt }: { qname: string; vt: number }) {
    if (this.queues[qname]) {
      throw new QueueExistsError(qname);
    }

    this.queues[qname] = { vt0: vt, lastId: 0, data: [] };
    return 1 as const;
  }

  async sendMessageAsync({ qname, message }: { qname: string; message: string }) {
    const queue = this.getQueue(qname);
    queue.lastId += 1;
    queue.data.push({ id: `${queue.lastId}`, message, vt: 0 });
    return `${queue.lastId}`;
  }

  async receiveMessageAsync({ qname }: { qname: string }) {
    const now = Date.now();
    const queue = this.getQueue(qname);
    const job = queue.data.find(j => j.vt < now);

    if (!job) return {};

    job.vt = now + queue.vt0;

    return job;
  }

  async deleteMessageAsync({ qname, id }: { qname: string; id: string }) {
    const queue = this.getQueue(qname);
    if (!queue.data.find(item => item.id === id)) return 0;
    queue.data = this.queues[qname].data.filter(item => item.id !== id);
    return 1;
  }

  async changeMessageVisibilityAsync({ qname, id, vt }: { qname: string; id: string; vt: number }) {
    const queue = this.getQueue(qname);
    const job = queue.data.find(j => j.id === id);
    if (job) {
      job.vt = Date.now() + vt * 1000;
      return 1;
    }
    return 0;
  }

  getQueue(qname: string) {
    if (!this.queues[qname]) throw new Error('Queue not found');
    return this.queues[qname];
  }
}
