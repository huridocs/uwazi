/**
 * @jest-environment jsdom
 */
import { shouldBlockDirtyLeave } from '../BlockDirtyNavigation.js';

describe('shouldBlockDirtyLeave', () => {
  it('does not block tab changes on the same entity path', () => {
    expect(shouldBlockDirtyLeave(true, '/en/entity/abc', '/en/entity/abc')).toBe(false);
  });

  it('does not block language changes that stay on the same entity', () => {
    expect(shouldBlockDirtyLeave(true, '/en/entity/abc', '/es/entity/abc')).toBe(false);
    expect(shouldBlockDirtyLeave(true, '/en/entityv2/abc', '/es/entityv2/abc')).toBe(false);
  });

  it('blocks navigating to another entity', () => {
    expect(shouldBlockDirtyLeave(true, '/en/entity/abc', '/en/entity/other')).toBe(true);
    expect(shouldBlockDirtyLeave(true, '/en/entityv2/abc', '/en/entityv2/other')).toBe(true);
  });

  it('blocks leaving entity v2 when dirty', () => {
    expect(shouldBlockDirtyLeave(true, '/en/entity/abc', '/en/library')).toBe(true);
    expect(shouldBlockDirtyLeave(false, '/en/entity/abc', '/en/library')).toBe(false);
  });
});
