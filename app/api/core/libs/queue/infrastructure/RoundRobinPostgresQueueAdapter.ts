import { PostgresQueueAdapter } from './PostgresQueueAdapter.js';
import { Job } from './QueueAdapter.js';

export class RoundRobinPostgresQueueAdapter extends PostgresQueueAdapter {
  private latestTenants: string[] = ['', ''];

  async pickJob(queueName: string): Promise<Job | null> {
    const job = (await this.pick(queueName, this.latestTenants)) ?? (await this.pick(queueName));

    if (job) {
      this.latestTenants.shift();
      this.latestTenants.push(job.namespace);
    }
    return job;
  }
}
