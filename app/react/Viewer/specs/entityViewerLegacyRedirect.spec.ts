/**
 * @jest-environment node
 */
import {
  ENTITY_VIEWER_LEGACY_REDIRECT_STATUS,
  getEntityViewerLegacyRedirect,
} from '../entityViewerLegacyRedirect.js';

describe('getEntityViewerLegacyRedirect', () => {
  it('uses 301 Moved Permanently for deprecated URL shapes', () => {
    expect(ENTITY_VIEWER_LEGACY_REDIRECT_STATUS).toBe(301);
    expect(getEntityViewerLegacyRedirect('/document/abc')?.status).toBe(301);
  });

  it('always redirects /document/:sharedId (and nested paths) to /entity/:sharedId', () => {
    expect(getEntityViewerLegacyRedirect('/document/abc')).toEqual({
      status: 301,
      pathname: '/entity/abc',
    });
    expect(getEntityViewerLegacyRedirect('/document/abc/text-search')).toEqual({
      status: 301,
      pathname: '/entity/abc',
    });
    expect(
      getEntityViewerLegacyRedirect('/en/document/abc/text-search', { languageKeys: ['en'] })
    ).toEqual({
      status: 301,
      pathname: '/en/entity/abc',
    });
  });

  it('does not rewrite plain /entity/:sharedId', () => {
    expect(getEntityViewerLegacyRedirect('/entity/abc')).toBeNull();
    expect(
      getEntityViewerLegacyRedirect('/entity/abc/info', { entityViewerV2: false })
    ).toBeNull();
  });

  it('when V2 flag is on, redirects any /entity/:sharedId/<extra> path', () => {
    expect(
      getEntityViewerLegacyRedirect('/entity/abc/info', { entityViewerV2: true })
    ).toEqual({ status: 301, pathname: '/entity/abc' });
    expect(
      getEntityViewerLegacyRedirect('/en/entity/abc/relationships/extra', {
        entityViewerV2: true,
        languageKeys: ['en'],
      })
    ).toEqual({ status: 301, pathname: '/en/entity/abc' });
    expect(
      getEntityViewerLegacyRedirect('/entity/abc/text-search', { entityViewerV2: true })
    ).toEqual({ status: 301, pathname: '/entity/abc' });
  });

  it('does not redirect legacy-entity or entityv2 mounts', () => {
    expect(
      getEntityViewerLegacyRedirect('/legacy-entity/abc/info', { entityViewerV2: true })
    ).toBeNull();
    expect(
      getEntityViewerLegacyRedirect('/entityv2/abc', { entityViewerV2: false })
    ).toBeNull();
  });
});
