/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { update, remove } from '#V2/api/files/index.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';
import { useDocumentFieldMutations } from '../useDocumentFieldMutations.js';

jest.mock('#V2/api/files/index.js', () => ({
  update: jest.fn().mockResolvedValue({ _id: 'doc1', originalname: 'new.pdf' }),
  remove: jest.fn().mockResolvedValue(undefined),
}));

describe('useDocumentFieldMutations', () => {
  const refreshEntity = jest.fn().mockResolvedValue(undefined);
  const revalidate = jest.fn().mockResolvedValue(undefined);
  const applyUpdatedFile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();
    entityLoaderCache.setEntity('shared1', 'en', {
      _id: 'e1',
      sharedId: 'shared1',
      language: 'en',
      title: 'Entity',
      template: 't',
      creationDate: 1,
      user: 'u1',
      relations: [],
      documents: [{ _id: 'doc1', originalname: 'old.pdf' }],
    });
    entityLoaderCache.setMainDocument('shared1', 'en', { _id: 'doc1', originalname: 'old.pdf' });
  });

  const renderMutations = () =>
    renderHook(() =>
      useDocumentFieldMutations({
        sharedId: 'shared1',
        language: 'en',
        applyUpdatedFile,
        revalidate,
        refreshEntity,
      })
    );

  it('should rename the document, patch the entity cache, and revalidate without invalidating', async () => {
    const { result } = renderMutations();

    await act(async () => {
      await result.current.renameDocument({ _id: 'doc1', originalname: 'old.pdf' }, 'new.pdf');
    });

    expect(update).toHaveBeenCalledWith({ _id: 'doc1', originalname: 'new.pdf' });
    expect(applyUpdatedFile).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'doc1', originalname: 'new.pdf' })
    );
    expect(entityLoaderCache.getEntity('shared1', 'en')?.documents?.[0]?.originalname).toBe(
      'new.pdf'
    );
    expect(entityLoaderCache.getMainDocument('shared1', 'en')?.originalname).toBe('new.pdf');
    expect(revalidate).toHaveBeenCalled();
    expect(refreshEntity).not.toHaveBeenCalled();
  });

  it('should throw when rename fails and skip cache updates', async () => {
    (update as jest.Mock).mockResolvedValueOnce(new FetchResponseError('failed'));
    const { result } = renderMutations();

    await act(async () => {
      await expect(
        result.current.renameDocument({ _id: 'doc1', originalname: 'old.pdf' }, 'new.pdf')
      ).rejects.toBeInstanceOf(FetchResponseError);
    });

    expect(applyUpdatedFile).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
    expect(entityLoaderCache.getEntity('shared1', 'en')?.documents?.[0]?.originalname).toBe(
      'old.pdf'
    );
  });

  it('should remove the document and refresh the entity', async () => {
    const { result } = renderMutations();

    await act(async () => {
      await result.current.removeDocument('doc1');
    });

    expect(remove).toHaveBeenCalledWith('doc1');
    expect(refreshEntity).toHaveBeenCalled();
  });
});
