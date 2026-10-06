import { ZodError } from 'zod';
import { SegmentationRoutes } from '../../SegmentationRoutes.js';

const route = (name: string) => {
  const found = SegmentationRoutes.all().find(r => r.name === name);
  if (!found) throw new Error(`no segmentation ${name} route`);
  return found;
};

describe('SegmentationRoutes', () => {
  it('should register queue-idle, for a single tenant', () => {
    expect(SegmentationRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['segmentation queue-idle', 'single'],
    ]);
  });

  it('should not need Redis: requests are queued as jobs', () => {
    expect(route('queue-idle').needs).toEqual({ redis: false, elasticsearch: false });
  });

  it('should take an empty request only', () => {
    expect(route('queue-idle').request.parse({})).toEqual({});
    expect(() => route('queue-idle').request.parse({ batchSize: 10 })).toThrow(ZodError);
  });
});
