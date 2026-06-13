import {
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import type { RawBucket } from './DatavizResultNormalizer.js';

export const collectBucketKeysFromRawBuckets = (buckets: RawBucket[]): string[] => {
  const keys = new Set<string>();

  buckets.forEach(bucket => {
    const id = bucket._id;
    if (id && typeof id === 'object' && 'primary' in id) {
      keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id.primary))));
      keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id.secondary))));
      return;
    }

    keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id))));
  });

  return [...keys];
};
