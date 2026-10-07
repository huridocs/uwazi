import { ActivityLogQueryServiceFactory } from '#activitylog';
import type { ListActivityOutput, ListActivityRequest } from '../contracts.js';

class ListActivityController {
  static async handle({ limit }: ListActivityRequest): Promise<ListActivityOutput> {
    const entries = await ActivityLogQueryServiceFactory.default().recent({ limit });

    /** Field by field, so a change to the read model cannot leak into the CLI contract. */
    return entries.map(({ method, url, username, time }) => ({ method, url, username, time }));
  }
}

export { ListActivityController };
