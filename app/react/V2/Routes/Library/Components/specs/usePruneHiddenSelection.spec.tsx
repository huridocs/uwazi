/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { usePruneHiddenSelection } from '../useLibraryResultSelection.js';

describe('usePruneHiddenSelection', () => {
  it('drops records that leave the page and ignores a selection change on the same page', () => {
    const onSelectedIdsChange = jest.fn();
    const { rerender } = renderHook(
      ({ pageIds, selectedIds }: { pageIds: readonly string[]; selectedIds: readonly string[] }) =>
        usePruneHiddenSelection(pageIds, selectedIds, onSelectedIdsChange),
      { initialProps: { pageIds: ['mexico', 'gelman'], selectedIds: ['mexico', 'gelman'] } }
    );

    expect(onSelectedIdsChange).not.toHaveBeenCalled();

    rerender({ pageIds: ['mexico', 'gelman'], selectedIds: ['mexico', 'hidden'] });
    expect(onSelectedIdsChange).not.toHaveBeenCalled();

    rerender({ pageIds: ['mexico'], selectedIds: ['mexico', 'hidden'] });
    expect(onSelectedIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['mexico']);
  });
});
