export interface QueueMessage {
  id: string;
  message: string;
}

export interface QueueAdapter {
  pushJob(queueName: string, message: string): Promise<string>;
  pickJob(queueName: string): Promise<QueueMessage | {}>;
  renewJobLock(jobId: string, seconds: number): Promise<void>;
  completeJob(jobId: string): Promise<void>;
}
