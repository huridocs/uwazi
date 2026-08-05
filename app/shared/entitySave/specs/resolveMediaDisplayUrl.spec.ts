import { resolveMediaDisplayUrl } from '../resolveMediaDisplayUrl.js';

describe('resolveMediaDisplayUrl', () => {
  it('extracts the playable url from timelink-encoded media values', () => {
    const value = '(/api/files/video.mp4, {"timelinks":{"00:00:01":"intro"}})';

    expect(resolveMediaDisplayUrl(value, [])).toBe('/api/files/video.mp4');
  });
});
