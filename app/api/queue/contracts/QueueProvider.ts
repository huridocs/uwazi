import { Job } from './Job';

export interface QueueProvider {
  push(job: Job): Promise<void>;
}
