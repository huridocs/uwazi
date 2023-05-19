export interface Job {
  handle(): Promise<void>;
}
