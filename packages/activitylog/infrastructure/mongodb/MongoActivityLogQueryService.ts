import type { Db } from 'mongodb';
import type { ActivityLogEntry, ActivityLogQueryService } from '../../ActivityLogQueryService.js';

type ActivityLogDBO = { method: string; url: string; username?: string | null; time: number };

class MongoActivityLogQueryService implements ActivityLogQueryService {
  constructor(private readonly db: Db) {}

  async recent({ limit }: { limit: number }): Promise<ActivityLogEntry[]> {
    const entries = await this.db
      .collection<ActivityLogDBO>('activitylogs')
      .find({}, { projection: { _id: 0, method: 1, url: 1, username: 1, time: 1 } })
      .sort({ time: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return entries.map(({ method, url, username, time }) => ({
      method,
      url,
      username: username ?? null,
      time,
    }));
  }
}

export { MongoActivityLogQueryService };
