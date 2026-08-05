/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import type { ClientFile } from '#app/istore.js';
import { useEntityMediaUpload } from '../useEntityMediaUpload.js';

const pendingFile = (fileLocalID: string): ClientFile => ({
  _id: fileLocalID,
  fileLocalID,
  originalname: `${fileLocalID}.png`,
  filename: `${fileLocalID}.png`,
  type: 'attachment',
  serializedFile: 'data:image/png;base64,aW1hZ2U=',
  mimetype: 'image/png',
  entity: 'entity1',
});

describe('useEntityMediaUpload', () => {
  it('keeps entityAttachments free of pending uploads', () => {
    const { result } = renderHook(() =>
      useEntityMediaUpload(
        { sharedId: 'entity1', attachments: [{ _id: 'a1', filename: 'saved.pdf' }] },
        't1'
      )
    );

    act(() => {
      result.current.registerPendingAttachment(pendingFile('local1'));
    });

    expect(result.current.entityAttachments).toHaveLength(1);
    expect(result.current.pendingAttachments).toHaveLength(1);
  });

  it('clears pending attachments when template changes', () => {
    const { result, rerender } = renderHook(
      ({ templateId }) => useEntityMediaUpload({ sharedId: 'entity1' }, templateId),
      { initialProps: { templateId: 't1' } }
    );

    act(() => {
      result.current.registerPendingAttachment(pendingFile('local1'));
    });
    expect(result.current.pendingAttachments).toHaveLength(1);

    rerender({ templateId: 't2' });
    expect(result.current.pendingAttachments).toHaveLength(0);
  });
});
