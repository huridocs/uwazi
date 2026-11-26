/** @jest-environment jsdom */
/* eslint-disable max-statements */
import { act, renderHook } from '@testing-library/react';
import type { ClientFile } from '#app/istore.js';
import { useMetadataEditing } from '../MetadataEditingContext.js';
import { entity, getBySharedId, wrapper } from './metadataEditingSpecSetup.js';

const pendingFile = (fileLocalID: string): ClientFile => ({
  _id: fileLocalID,
  fileLocalID,
  originalname: `${fileLocalID}.png`,
  filename: `${fileLocalID}.png`,
  type: 'attachment',
  serializedFile: 'data:image/png;base64,aW1hZ2U=',
  mimetype: 'image/png',
  entity: 's1',
});

describe('MetadataEditingContext', () => {
  beforeEach(() => {
    getBySharedId.mockReset();
    getBySharedId.mockResolvedValue([[entity]]);
  });
  it('starts editing and tracks last metadata anchor', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('main');
    });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.lastMetadataAnchor).toBe('main');

    act(() => {
      result.current.startEditing('side');
    });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.lastMetadataAnchor).toBe('side');
  });

  it('requestDiscard cancels immediately when the form is clean', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('main');
    });
    act(() => {
      result.current.requestDiscard('discard');
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.pendingDiscardAction).toBeUndefined();
  });

  it('requestStopTranslations waits for confirm and leaves the action unrun on dismiss', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    const run = jest.fn();

    await act(async () => {
      result.current.startEditing('main');
    });
    act(() => {
      result.current.setTranslationsPending(true);
      result.current.requestStopTranslations(run);
    });

    expect(run).not.toHaveBeenCalled();
    expect(result.current.translationStopOpen).toBe(true);
    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.dismissStopTranslations();
    });
    expect(run).not.toHaveBeenCalled();
    expect(result.current.translationStopOpen).toBe(false);

    act(() => {
      result.current.requestStopTranslations(run);
      result.current.confirmStopTranslations();
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(result.current.translationStopOpen).toBe(false);
  });

  it('requestStopTranslations runs immediately when nothing is pending', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    const run = jest.fn();

    act(() => {
      result.current.requestStopTranslations(run);
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(result.current.translationStopOpen).toBe(false);
  });

  it('requestDiscard confirms before leaving a dirty form', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    const proceed = jest.fn();
    const onStay = jest.fn();

    await act(async () => {
      result.current.startEditing('main');
    });
    act(() => {
      result.current.setIsDirty(true);
    });
    act(() => {
      result.current.requestDiscard('discard', proceed, onStay);
    });

    expect(proceed).not.toHaveBeenCalled();
    expect(result.current.pendingDiscardAction).toBe('discard');
    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.dismissDiscard();
    });
    expect(proceed).not.toHaveBeenCalled();
    expect(onStay).toHaveBeenCalledTimes(1);
    expect(result.current.pendingDiscardAction).toBeUndefined();
    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.requestDiscard('discard', proceed);
      result.current.confirmDiscard();
    });
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.pendingDiscardAction).toBeUndefined();
  });

  it('cancelEdit clears editing state and aborts running translations', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    const cancel = jest.fn();

    act(() => {
      result.current.registerCancelTranslations(cancel);
    });
    await act(async () => {
      result.current.startEditing('side');
    });
    act(() => {
      result.current.setIsDirty(true);
      result.current.setIsSaving(true);
      result.current.setTranslationsPending(true);
      result.current.cancelEdit();
    });

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result.current.translationsPending).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.lastMetadataAnchor).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('tracks formMountHost via registerMetadataActive and prefers edit host', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('main', true);
    });
    await act(async () => {
      result.current.startEditing('side');
    });
    act(() => {
      result.current.registerMetadataActive('side', true);
    });
    expect(result.current.lastMetadataAnchor).toBe('side');
    expect(result.current.formMountHost).toBe('side');

    act(() => {
      result.current.registerMetadataActive('main', true);
    });
    expect(result.current.lastMetadataAnchor).toBe('side');
    expect(result.current.formMountHost).toBe('side');
  });

  it('preserves pending media across form mount host changes', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('side');
    });
    act(() => {
      result.current.registerMetadataActive('side', true);
      result.current.mediaUpload.registerPendingAttachment(pendingFile('local1'));
    });
    expect(result.current.mediaUpload.pendingAttachments).toHaveLength(1);

    act(() => {
      result.current.registerMetadataActive('side', false);
      result.current.registerMetadataActive('main', true);
    });

    expect(result.current.formMountHost).toBe('main');
    expect(result.current.mediaUpload.pendingAttachments).toHaveLength(1);
    expect(result.current.mediaUpload.pendingAttachments[0]?.fileLocalID).toBe('local1');
  });

  it('aborts in-flight save only via cancelEdit, not host remount registration', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    let signal: AbortSignal | undefined;

    await act(async () => {
      result.current.startEditing('side');
    });
    act(() => {
      result.current.registerMetadataActive('side', true);
      signal = result.current.tryBeginSave()?.signal;
    });
    expect(signal?.aborted).toBe(false);

    act(() => {
      result.current.registerMetadataActive('side', false);
      result.current.registerMetadataActive('main', true);
    });
    expect(signal?.aborted).toBe(false);
    expect(result.current.formMountHost).toBe('main');

    act(() => {
      result.current.cancelEdit();
    });
    expect(signal?.aborted).toBe(true);
    expect(result.current.isEditing).toBe(false);
  });

  it('tryBeginSave rejects a second in-flight save', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('main');
    });

    let first: AbortController | null = null;
    let second: AbortController | null = null;
    act(() => {
      first = result.current.tryBeginSave();
      second = result.current.tryBeginSave();
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(result.current.isSaving).toBe(true);

    act(() => {
      result.current.endSave();
    });
    expect(result.current.isSaving).toBe(false);
  });

  it('ignores startEditing join while a save is in flight', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('side', true);
      result.current.registerMetadataActive('main', true);
    });
    await act(async () => {
      result.current.startEditing('side');
    });
    act(() => {
      result.current.tryBeginSave();
    });
    expect(result.current.formMountHost).toBe('side');
    expect(result.current.isSaving).toBe(true);

    act(() => {
      result.current.startEditing('main');
    });
    expect(result.current.formMountHost).toBe('side');
    expect(result.current.lastMetadataAnchor).toBe('side');
  });

  it('clears editErrors on finishEditing', async () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    await act(async () => {
      result.current.startEditing('main');
    });
    act(() => {
      result.current.setEditErrors({ title: 'Title is required' });
    });
    expect(result.current.editErrors?.title).toBe('Title is required');

    act(() => {
      result.current.finishEditing();
    });
    expect(result.current.editErrors).toBeUndefined();
  });
});
