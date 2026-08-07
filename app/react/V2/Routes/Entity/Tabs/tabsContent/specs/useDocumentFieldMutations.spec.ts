/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { update, remove } from '#V2/api/files/index.js';
import { useDocumentFieldMutations } from '../useDocumentFieldMutations.js';

jest.mock('#V2/api/files/index.js', () => ({
  update: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
}));

describe('useDocumentFieldMutations', () => {
  const refreshEntity = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rename the document and refresh the entity', async () => {
    const { result } = renderHook(() => useDocumentFieldMutations({ refreshEntity }));

    await act(async () => {
      await result.current.renameDocument({ _id: 'doc1', originalname: 'old.pdf' }, 'new.pdf');
    });

    expect(update).toHaveBeenCalledWith({ _id: 'doc1', originalname: 'new.pdf' });
    expect(refreshEntity).toHaveBeenCalled();
  });

  it('should remove the document and refresh the entity', async () => {
    const { result } = renderHook(() => useDocumentFieldMutations({ refreshEntity }));

    await act(async () => {
      await result.current.removeDocument('doc1');
    });

    expect(remove).toHaveBeenCalledWith('doc1');
    expect(refreshEntity).toHaveBeenCalled();
  });
});
