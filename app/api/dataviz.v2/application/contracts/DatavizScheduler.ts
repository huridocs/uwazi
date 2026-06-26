import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { User } from '#api/users.v2/model/User.js';

interface DatavizScheduler {
  cancelPending(datavizId: string): Promise<void>;
  schedule(dataviz: Dataviz, actor: User, runImmediately?: boolean): Promise<void>;
}

export type { DatavizScheduler };
