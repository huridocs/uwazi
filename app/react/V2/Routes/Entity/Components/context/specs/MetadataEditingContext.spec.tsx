/** @jest-environment jsdom */
import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { ClientFile } from '#app/istore.js';
import type { Entity } from '#V2/api/entities/types.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { EntityProvider } from '../EntityContext.js';
import { MetadataEditingProvider, useMetadataEditing } from '../MetadataEditingContext.js';

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {
    simple_text: [{ value: 'entity-text' }],
    report: [{ value: 'entity-report' }],
  },
  creationDate: 0,
  user: 'user1',
};

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

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestAtomStoreProvider
    initialValues={[[templatesAtom, [{ _id: 't1', name: 'T', properties: [] }]]]}
  >
    <EntityProvider entity={entity}>
      <MetadataEditingProvider>{children}</MetadataEditingProvider>
    </EntityProvider>
  </TestAtomStoreProvider>
);

describe('MetadataEditingContext', () => {
  it('starts editing and tracks last metadata anchor', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
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

  it('cancelEdit clears editing, dirty, and saving state', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('side');
      result.current.setIsDirty(true);
      result.current.setIsSaving(true);
    });

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.lastMetadataAnchor).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('tracks formMountHost via registerMetadataActive and prefers edit host', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('main', true);
      result.current.startEditing('side');
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

  it('preserves pending media across form mount host changes', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('side');
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

  it('aborts in-flight save only via cancelEdit, not host remount registration', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    let signal: AbortSignal | undefined;

    act(() => {
      result.current.startEditing('side');
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

  it('tryBeginSave rejects a second in-flight save', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
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

  it('ignores startEditing join while a save is in flight', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('side', true);
      result.current.registerMetadataActive('main', true);
      result.current.startEditing('side');
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

  it('clears editErrors on finishEditing', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('main');
      result.current.setEditErrors({ title: 'Title is required' });
    });
    expect(result.current.editErrors?.title).toBe('Title is required');

    act(() => {
      result.current.finishEditing();
    });
    expect(result.current.editErrors).toBeUndefined();
  });
});
