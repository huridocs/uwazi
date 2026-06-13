import { Params } from '../application/contracts/Dispatchable.js';

export interface Job {
  id: string;
  queue: string;
  name: string;
  params: any;
  namespace: string;
  lockedUntil: number;
  createdAt: number;
  retryCount: number;
  options: {
    lockWindow: number;
    maxRetries: number;
  };
}

export type PushJobInput = Omit<Job, 'id' | 'createdAt' | 'retryCount' | 'lockedUntil'> & {
  lockedUntil?: number;
};

export interface QueueAdapter {
  pushJob(job: PushJobInput): Promise<string>;
  pushJobs(jobs: PushJobInput[]): Promise<string[]>;
  pickJob(queueName: string): Promise<Job | null>;
  renewJobLock(job: Job): Promise<void>;
  markJobAsFailed(job: Job): Promise<Job>;
  updateLockWindow(job: Job, newLockWindow: number): Promise<Job>;
  deleteJob(job: Job): Promise<void>;
  deleteByParams(jobName: string, params: Partial<Params>, tenantName: string): Promise<void>;
  cancelByParams(jobName: string, params: Partial<Params>, tenantName: string): Promise<void>;
}
