/**
 * @jest-environment jsdom
 */
import {
  buildEntitySnippetLink,
  buildEntityViewLink,
  getEntityViewerV1BasePath,
  getEntityViewerV2BasePath,
  getEntityViewerV2Path,
  isEntityPath,
  isEntityV2Path,
  isLegacyEntityPath,
} from '../entityViewerPaths.js';

describe('entityViewerPaths', () => {
  describe('path detection', () => {
    it('detects entity / entityv2 / legacy-entity mounts', () => {
      expect(isEntityPath('/en/entity/abc')).toBe(true);
      expect(isEntityPath('/en/entityv2/abc')).toBe(false);
      expect(isEntityPath('/en/legacy-entity/abc')).toBe(false);
      expect(isEntityV2Path('/en/entityv2/abc')).toBe(true);
      expect(isLegacyEntityPath('/en/legacy-entity/abc')).toBe(true);
    });
  });

  describe('base paths', () => {
    it('switches V2 public path when soft-deploy flag is on', () => {
      expect(getEntityViewerV2BasePath(false)).toBe('/entityv2');
      expect(getEntityViewerV2BasePath(true)).toBe('/entity');
      expect(getEntityViewerV1BasePath(false)).toBe('/entity');
      expect(getEntityViewerV1BasePath(true)).toBe('/legacy-entity');
      expect(getEntityViewerV2Path('abc', true)).toBe('/entity/abc');
      expect(getEntityViewerV2Path('abc', false)).toBe('/entityv2/abc');
    });
  });

  describe('buildEntitySnippetLink', () => {
    it('builds V1 text-search links with query params', () => {
      expect(
        buildEntitySnippetLink({
          sharedId: 'abc',
          searchTerm: 'court',
          page: 3,
          filename: 'file.pdf',
        })
      ).toBe('/entity/abc/text-search?page=3&searchTerm=court&file=file.pdf');
    });

    it('builds V2 hash deep-links when flag is on', () => {
      expect(
        buildEntitySnippetLink({
          sharedId: 'abc',
          searchTerm: 'court',
          page: 3,
          entityViewerV2: true,
        })
      ).toBe('/entity/abc#s=search&searchTerm=court&page=3');
    });

    it('keeps V1 format inside legacy viewer even when flag is on', () => {
      expect(
        buildEntitySnippetLink({
          sharedId: 'abc',
          searchTerm: 'court',
          page: 2,
          entityViewerV2: true,
          legacyBasePath: '/legacy-entity',
        })
      ).toBe('/legacy-entity/abc/text-search?page=2&searchTerm=court');
    });
  });

  describe('buildEntityViewLink', () => {
    it('builds V1 view links with searchTerm/ref query', () => {
      expect(buildEntityViewLink({ sharedId: 'abc', searchTerm: 'foo', refId: 'r1' })).toBe(
        '/entity/abc?searchTerm=foo&ref=r1'
      );
    });

    it('builds V2 search deep-link when flag is on and searchTerm is present', () => {
      expect(
        buildEntityViewLink({ sharedId: 'abc', searchTerm: 'foo', entityViewerV2: true })
      ).toBe('/entity/abc#s=search&searchTerm=foo');
    });

    it('builds plain V2 entity path when flag is on without searchTerm', () => {
      expect(buildEntityViewLink({ sharedId: 'abc', entityViewerV2: true })).toBe('/entity/abc');
    });
  });
});
