/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { entityWithRelations } from '../../../Components/relationships/specs/fixtures/entityWithRelations.js';
import { useEntityMainTabs } from '../useEntityMainTabs.js';

jest.mock('../../../entityUrlState', () => ({
  useEntitySearchParams: () => new URLSearchParams(),
  useUpdateEntityUrl: () => jest.fn(),
}));

jest.mock('../useEntitySideButtonModel', () => ({
  useEntitySideButtonModel: () => ({
    buttonsFor: () => [],
  }),
}));

describe('useEntityMainTabs side pane', () => {
  it('requests the side pane without changing the side tab', () => {
    const { result } = renderHook(() =>
      useEntityMainTabs({
        entity: entityWithRelations,
        hasMainDocument: true,
        filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
      })
    );

    act(() => {
      result.current.showSidePane();
    });

    expect(result.current.requestedPane).toEqual({ index: 1, id: 1 });
  });
});
