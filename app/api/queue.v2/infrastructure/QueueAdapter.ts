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

export interface QueueAdapter {
  pushJob(job: Omit<Job, 'id' | 'lockedUntil' | 'createdAt'>): Promise<string>;
  pickJob(queueName: string): Promise<Job | null>;
  renewJobLock(job: Job): Promise<void>;
  markJobAsFailed(job: Job): Promise<void>;
  deleteJob(job: Job): Promise<void>;
}
