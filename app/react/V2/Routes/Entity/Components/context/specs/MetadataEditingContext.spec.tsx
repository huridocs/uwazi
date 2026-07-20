/**
 * @jest-environment jsdom
 */
import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MetadataEditingProvider, useMetadataEditing } from '../MetadataEditingContext.js';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MetadataEditingProvider>{children}</MetadataEditingProvider>
);

describe('MetadataEditingContext', () => {
  it('starts editing on a host and blocks the other host', () => {
    const { result } = renderHook(() => useMetadataEditing(), { wrapper });

    act(() => {
      result.current.startEditing('main');
    });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingHost).toBe('main');

    act(() => {
      result.current.startEditing('side');
    });
    expect(result.current.editingHost).toBe('main');
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
    expect(result.current.editingHost).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });
});
