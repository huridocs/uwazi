import { Job } from './Job';

export interface JobsDispatcher {
  dispatch(job: Job): Promise<void>;
}
