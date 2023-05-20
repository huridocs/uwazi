import { QueueAdapter } from 'api/queue/contracts/QueueAdapter';

export class MemoryQueue implements QueueAdapter {
  private seqId = 0;

  private queue: { id: string; message: string; vt: number }[] = [];

  private vt = 30 * 1000;

  constructor(vt: number) {
    this.vt = vt * 1000;
  }

  async sendMessageAsync({ message }: { message: string }) {
    this.seqId += 1;
    this.queue.push({ id: `${this.seqId}`, message, vt: 0 });
    return `${this.seqId}`;
  }

  async receiveMessageAsync() {
    const now = Date.now();
    const job = this.queue.find(j => j.vt < now);

    if (!job) return {};

    job.vt = now + this.vt;

    return job;
  }

  async deleteMessageAsync({ id }: { id: string }) {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  async changeMessageVisibilityAsync({ id, vt }: { id: string; vt: number }): Promise<void> {
    const job = this.queue.find(j => j.id === id);
    if (job) {
      job.vt = Date.now() + vt * 1000;
    }
  }

  getQueue() {
    return this.queue;
  }
}
