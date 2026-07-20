/**
 * @jest-environment jsdom
 */
import { isMetadataHostDirty, keepMetadataTab, resolveActiveTabId } from '../metadataTabSession.js';

describe('metadataTabSession', () => {
  it('resolveActiveTabId prefers the atom id', () => {
    expect(resolveActiveTabId('toc', 'metadata')).toBe('toc');
    expect(resolveActiveTabId(undefined, 'metadata')).toBe('metadata');
  });

  it('keepMetadataTab keeps the owning host while editing', () => {
    expect(keepMetadataTab(false, true, 'side', 'side')).toBe(true);
    expect(keepMetadataTab(false, true, 'side', 'main')).toBe(false);
    expect(keepMetadataTab(true, false, null, 'main')).toBe(true);
  });

  it('isMetadataHostDirty is only true for the owning dirty host', () => {
    expect(isMetadataHostDirty(true, 'main', 'main')).toBe(true);
    expect(isMetadataHostDirty(true, 'main', 'side')).toBe(false);
    expect(isMetadataHostDirty(false, 'main', 'main')).toBe(false);
  });
});
