import {
  getLibraryV1BasePath,
  getLibraryV2BasePath,
  isLegacyLibraryPath,
  isLibraryPath,
  isLibraryV2Enabled,
  isLibraryV2MountPath,
  isLibraryV2Route,
} from '../libraryPaths.js';

describe('libraryPaths', () => {
  describe('path detection', () => {
    it('detects library / libraryv2 / legacy-library mounts', () => {
      expect(isLibraryPath('/en/library')).toBe(true);
      expect(isLibraryPath('/en/library/table')).toBe(true);
      expect(isLibraryPath('/en/libraryv2')).toBe(false);
      expect(isLibraryPath('/en/legacy-library')).toBe(false);
      expect(isLibraryV2MountPath('/en/libraryv2')).toBe(true);
      expect(isLegacyLibraryPath('/en/legacy-library/map')).toBe(true);
    });
  });

  describe('base paths', () => {
    it('switches V2 public path when soft-deploy flag is on', () => {
      expect(getLibraryV2BasePath(false)).toBe('/libraryv2');
      expect(getLibraryV2BasePath(true)).toBe('/library');
      expect(getLibraryV1BasePath(false)).toBe('/library');
      expect(getLibraryV1BasePath(true)).toBe('/legacy-library');
    });
  });

  describe('isLibraryV2Enabled', () => {
    it('reads featureFlagLibraryV2', () => {
      expect(isLibraryV2Enabled(undefined)).toBe(false);
      expect(isLibraryV2Enabled({ featureFlagLibraryV2: false })).toBe(false);
      expect(isLibraryV2Enabled({ featureFlagLibraryV2: true })).toBe(true);
    });
  });

  describe('isLibraryV2Route', () => {
    it('treats /libraryv2 as V2 regardless of flag', () => {
      expect(isLibraryV2Route('/en/libraryv2', false)).toBe(true);
      expect(isLibraryV2Route('/en/libraryv2', true)).toBe(true);
    });

    it('treats /library as V2 only when flag is on', () => {
      expect(isLibraryV2Route('/en/library', false)).toBe(false);
      expect(isLibraryV2Route('/en/library', true)).toBe(true);
      expect(isLibraryV2Route('/en/legacy-library', true)).toBe(false);
    });
  });
});
