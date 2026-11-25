/** @jest-environment jsdom */
import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { ApiError } from '#shared/apiClient/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useMetadataEditing } from '../MetadataEditingContext.js';
import { editingTree, entity, getBySharedId, wrapper } from './metadataEditingSpecSetup.js';

const staleLoad = async (next: Entity, row: Entity) => {
  const holder = { entity };
  let resolveLoad: (value: [Entity[]]) => void = () => undefined;
  getBySharedId.mockImplementation(
    async () =>
      new Promise(resolve => {
        resolveLoad = resolve;
      })
  );
  const { result, rerender } = renderHook(() => useMetadataEditing(), {
    wrapper: ({ children }: { children: ReactNode }) => editingTree(holder.entity, children),
  });

  act(() => {
    result.current.startEditing('main');
  });
  holder.entity = next;
  rerender();

  await act(async () => {
    resolveLoad([[row]]);
  });

  return result;
};

describe('Metadata editing reload', () => {
  beforeEach(() => {
    getBySharedId.mockReset();
    getBySharedId.mockResolvedValue([[entity]]);
  });

  it('loads the shared entity into the form before editing opens', async () => {
    const fresh: Entity = {
      ...entity,
      title: 'Fresh title',
      user: 'fresh-user',
      editDate: 1704153600,
      metadata: { simple_text: [{ value: 'fresh-text' }] },
    };
    getBySharedId.mockResolvedValue([[fresh]]);
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('side');
    });

    expect(getBySharedId).toHaveBeenCalledWith('s1', { language: 'en', omitRelationships: false });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.getValues('title')).toBe('Fresh title');
    expect(result.current.editBase).toBe(fresh);
    expect(result.current.editBase?.editDate).toBe(1704153600);
  });

  it('keeps the metadata record in place when the entity cannot be loaded', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    act(() => {
      result.current.form.setValue('title', 'Kept title');
    });
    getBySharedId.mockResolvedValue([
      undefined,
      new ApiError('Could not load the entity', { kind: 'http', status: 500 }),
    ]);

    await act(async () => {
      result.current.startEditing('main');
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.saveError).toBe('Could not load the entity');
    expect(result.current.form.getValues('title')).toBe('Kept title');
  });

  it('opens a new entity editor without loading a shared entity', async () => {
    const draft: Entity = { ...entity, sharedId: '', title: 'New entity' };
    const { result } = renderHook(() => useMetadataEditing(), {
      wrapper: ({ children }: { children: ReactNode }) => editingTree(draft, children),
    });

    await act(async () => {
      result.current.startEditing('main');
    });

    expect(getBySharedId).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.getValues('title')).toBe('New entity');
  });

  it('keeps the open form when editing is started again', async () => {
    const fresh: Entity = { ...entity, title: 'Loaded title' };
    getBySharedId.mockResolvedValue([[fresh]]);
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('main');
    });
    expect(result.current.form.getValues('title')).toBe('Loaded title');

    act(() => {
      result.current.form.setValue('title', 'Edited title');
      result.current.startEditing('side');
    });

    expect(getBySharedId).toHaveBeenCalledTimes(1);
    expect(result.current.form.getValues('title')).toBe('Edited title');
    expect(result.current.lastMetadataAnchor).toBe('side');
  });

  it('keeps the form closed when a loaded row belongs to a previous shared id', async () => {
    const result = await staleLoad(
      { ...entity, sharedId: 's2', title: 'Switched entity' },
      { ...entity, title: 'Stale title', user: 'stale-user' }
    );

    expect(result.current.isEditing).toBe(false);
    expect(result.current.form.getValues('title')).toBe('Entity');
  });

  it('keeps the form closed when a loaded row belongs to a previous language', async () => {
    const result = await staleLoad(
      { ...entity, language: 'es', title: 'Entidad' },
      { ...entity, title: 'Stale English', user: 'stale-user' }
    );

    expect(result.current.isEditing).toBe(false);
    expect(result.current.form.getValues('title')).toBe('Entity');
  });
});
