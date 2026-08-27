/**
 * @jest-environment jsdom
 */
import {
  keepMetadataTab,
  resolveActiveTabId,
  resolveControlledTabId,
  resolveFormMountHost,
} from '../metadataEditingSession.js';

describe('metadataEditingSession', () => {
  it('resolveActiveTabId prefers the atom id', () => {
    expect(resolveActiveTabId('toc', 'metadata')).toBe('toc');
    expect(resolveActiveTabId(undefined, 'metadata')).toBe('metadata');
  });

  it('resolveControlledTabId prefers the controlled id', () => {
    expect(resolveControlledTabId('metadata', 'toc')).toBe('metadata');
    expect(resolveControlledTabId(undefined, 'toc')).toBe('toc');
  });

  it('keepMetadataTab keeps the form mount host while editing', () => {
    expect(keepMetadataTab(false, true, 'side', 'side')).toBe(true);
    expect(keepMetadataTab(false, true, 'side', 'main')).toBe(false);
    expect(keepMetadataTab(true, false, null, 'main')).toBe(true);
    expect(keepMetadataTab(true, true, 'side', 'main')).toBe(true);
  });

  it('resolveFormMountHost prefers lastMetadataAnchor when that host is active', () => {
    expect(resolveFormMountHost(true, true, 'side')).toBe('side');
    expect(resolveFormMountHost(true, true, 'main')).toBe('main');
    expect(resolveFormMountHost(false, true, 'main')).toBe('side');
    expect(resolveFormMountHost(true, false, 'side')).toBe('main');
    expect(resolveFormMountHost(false, false, 'side')).toBe('side');
    expect(resolveFormMountHost(false, false, null)).toBeNull();
  });
});
