/**
 * @jest-environment jsdom
 */
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
  metadata: {},
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
  it('starts editing and lets the other host join the same session', () => {
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
    expect(result.current.form.getValues('title')).toBe('Entity');
  });

  it('preserves form draft across startEditing joins', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('side');
      result.current.form.setValue('title', 'Dirty title', { shouldDirty: true });
      result.current.setIsDirty(true);
    });

    act(() => {
      result.current.startEditing('main');
    });

    expect(result.current.form.getValues('title')).toBe('Dirty title');
    expect(result.current.isDirty).toBe(true);
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

  it('tracks last metadata anchor via registerMetadataActive', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('side');
      result.current.registerMetadataActive('side', true);
    });
    expect(result.current.lastMetadataAnchor).toBe('side');
    expect(result.current.formMountHost).toBe('side');

    act(() => {
      result.current.registerMetadataActive('main', true);
    });
    expect(result.current.formMountHost).toBe('main');
    expect(result.current.lastMetadataAnchor).toBe('main');
  });

  it('does not update lastMetadataAnchor when re-registering an already active host', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('main', true);
      result.current.startEditing('main');
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

  it('prefers edit host when both metadata panes are active', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('main', true);
      result.current.startEditing('side');
      result.current.registerMetadataActive('side', true);
    });

    expect(result.current.lastMetadataAnchor).toBe('side');
    expect(result.current.formMountHost).toBe('side');
  });

  it('moves formMountHost to the other pane on startEditing join without resetting draft', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.registerMetadataActive('main', true);
      result.current.registerMetadataActive('side', true);
      result.current.startEditing('side');
      result.current.form.setValue('title', 'Joined draft', { shouldDirty: true });
      result.current.setIsDirty(true);
    });
    expect(result.current.formMountHost).toBe('side');

    act(() => {
      result.current.startEditing('main');
    });

    expect(result.current.formMountHost).toBe('main');
    expect(result.current.lastMetadataAnchor).toBe('main');
    expect(result.current.form.getValues('title')).toBe('Joined draft');
    expect(result.current.isDirty).toBe(true);
  });

  it('keeps dirty draft when form mount host moves from side to main', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('side');
      result.current.registerMetadataActive('side', true);
      result.current.form.setValue('title', 'Side draft', { shouldDirty: true });
      result.current.setIsDirty(true);
    });

    act(() => {
      result.current.registerMetadataActive('side', false);
      result.current.registerMetadataActive('main', true);
    });

    expect(result.current.formMountHost).toBe('main');
    expect(result.current.form.getValues('title')).toBe('Side draft');
    expect(result.current.isDirty).toBe(true);
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
      signal = result.current.beginSaveAbort().signal;
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

  it('does not expose setIsEditing on the public API', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });
    expect('setIsEditing' in result.current).toBe(false);
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
