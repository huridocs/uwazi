/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { MAIN_TAB, SIDE_TAB, type SideTabId } from '../../tabIds.js';
import { useEntityTabUrlSanitize } from '../useEntityTabUrlSanitize.js';

jest.mock('../../../Components/EntityPageView/EntityPageViewContext.tsx', () => ({
  useEntityPageView: () => ({ hasEntityPageView: false }),
}));

const buttons = [SIDE_TAB.DOCUMENT, SIDE_TAB.METADATA, SIDE_TAB.FILES, SIDE_TAB.FILE].map(id => ({
  id,
  label: id,
}));

const renderSanitize = (
  search: string,
  hash: string,
  options?: { activeMainTab?: SideTabId; suspend?: boolean }
) => {
  const updateEntityUrl = jest.fn();
  renderHook(() =>
    useEntityTabUrlSanitize({
      hashParams: new URLSearchParams(hash),
      searchParams: new URLSearchParams(search),
      activeMainTab: options?.activeMainTab ?? SIDE_TAB.FILES,
      sideButtons: buttons,
      mainTabIds: new Set([
        MAIN_TAB.DOCUMENT,
        MAIN_TAB.METADATA,
        MAIN_TAB.RELATIONSHIPS,
        MAIN_TAB.FILES,
      ]),
      hasMainDocument: true,
      suspend: options?.suspend ?? false,
      updateEntityUrl,
    })
  );
  return updateEntityUrl;
};

describe('useEntityTabUrlSanitize', () => {
  it('leaves a file left tab alone while a pane change is pending', () => {
    const updateEntityUrl = renderSanitize('m=file', '', { suspend: true });

    expect(updateEntityUrl).not.toHaveBeenCalled();
  });

  it('rewrites a file left tab to files on the left and file on the right', () => {
    const updateEntityUrl = renderSanitize('m=file', '');
    const search = new URLSearchParams('m=file');

    updateEntityUrl.mock.calls[0][0].search(search);

    expect(search.get('m')).toBe('files');
    expect(updateEntityUrl.mock.calls[0][0].hash).toBeUndefined();
  });

  it('keeps an explicit side tab when the left url asked for file', () => {
    const updateEntityUrl = renderSanitize('m=file', 's=metadata');

    expect(updateEntityUrl.mock.calls[0][0].hash).toBeUndefined();
  });

  it('drops a side tab that repeats the left tab', () => {
    const updateEntityUrl = renderSanitize('m=metadata', 's=metadata', {
      activeMainTab: SIDE_TAB.METADATA,
    });
    const hash = new URLSearchParams('s=metadata');

    updateEntityUrl.mock.calls[0][0].hash(hash);

    expect(hash.get('s')).toBeNull();
  });

  it('leaves a table of contents left tab in place', () => {
    const updateEntityUrl = renderSanitize('m=toc', 's=document');

    expect(updateEntityUrl).not.toHaveBeenCalled();
  });
});
