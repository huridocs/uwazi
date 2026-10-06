import type { Db } from 'mongodb';
import type { ContentUsageReader } from '../../application/contracts/ContentUsageReader.js';
import { FileUsage, type FileGroup } from '../../application/FileUsage.js';
import type { ContentUsage } from '../../application/TenantUsage.js';

type FileGroupDBO = {
  _id: { type?: string | null; mimetype?: string | null };
  count: number;
  size: number;
};

class MongoContentUsageReader implements ContentUsageReader {
  constructor(private readonly db: Db) {}

  async read(): Promise<ContentUsage> {
    const [entitiesCount, fileGroups] = await Promise.all([
      this.countEntities(),
      this.groupFiles(),
    ]);

    return { entitiesCount, ...FileUsage.summarize(fileGroups) };
  }

  private async countEntities(): Promise<number> {
    const [result] = await this.db
      .collection('entities')
      .aggregate<{ total: number }>([{ $group: { _id: '$sharedId' } }, { $count: 'total' }])
      .toArray();

    return result?.total ?? 0;
  }

  private async groupFiles(): Promise<FileGroup[]> {
    const groups = await this.db
      .collection('files')
      .aggregate<FileGroupDBO>([
        {
          $group: {
            _id: { type: '$type', mimetype: '$mimetype' },
            count: { $sum: 1 },
            size: { $sum: { $ifNull: ['$size', 0] } },
          },
        },
      ])
      .toArray();

    return groups.map(({ _id, count, size }) => ({
      type: _id.type ?? null,
      mimetype: _id.mimetype ?? null,
      count,
      size,
    }));
  }
}

export { MongoContentUsageReader };
