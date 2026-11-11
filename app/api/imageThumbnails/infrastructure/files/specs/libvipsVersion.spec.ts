import { libvipsVersionIsUsable, libvipsVersionOf } from '../libvipsVersion.js';

describe('libvipsVersion', () => {
  it.each(['8.18.7', '8.18.8', '8.19.0', '9.0.0'])('accepts %s', version => {
    expect(libvipsVersionIsUsable(version)).toBe(true);
  });

  it.each(['8.18.6', '8.12.1', '8.18', ''])('rejects %s', version => {
    expect(libvipsVersionIsUsable(version)).toBe(false);
  });

  it('reads the version from vips --version', () => {
    expect(libvipsVersionOf('vips-8.18.7\n')).toBe('8.18.7');
    expect(libvipsVersionOf('not installed')).toBeUndefined();
  });
});
