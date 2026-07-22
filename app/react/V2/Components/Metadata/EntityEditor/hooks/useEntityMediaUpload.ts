import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClientFile } from '#app/istore.js';
import type { Entity } from '#V2/api/entities/types.js';
import { revokeHTMLMediaView } from '#shared/fileUploadUtils.js';

type EntityMediaSource = Pick<Entity, 'sharedId'> &
  Partial<Pick<Entity, 'attachments' | 'documents'>>;

const revokePending = (attachments: ClientFile[]) => {
  attachments.forEach(attachment => {
    if (attachment.fileLocalID) {
      revokeHTMLMediaView(attachment.fileLocalID);
    }
  });
};

const useEntityMediaUpload = (entity?: EntityMediaSource, templateId?: string) => {
  const [pendingAttachments, setPendingAttachments] = useState<ClientFile[]>([]);
  const pendingRef = useRef(pendingAttachments);
  pendingRef.current = pendingAttachments;

  const entityAttachments = useMemo(
    () => [...(entity?.attachments ?? []), ...(entity?.documents ?? [])],
    [entity?.attachments, entity?.documents]
  );

  const registerPendingAttachment = useCallback((attachment: ClientFile) => {
    setPendingAttachments(current => [...current, attachment]);
  }, []);

  const removePendingAttachment = useCallback((fileLocalID: string) => {
    setPendingAttachments(current =>
      current.filter(attachment => attachment.fileLocalID !== fileLocalID)
    );
    revokeHTMLMediaView(fileLocalID);
  }, []);

  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments(current => {
      revokePending(current);
      return [];
    });
  }, []);

  useEffect(() => {
    clearPendingAttachments();
  }, [clearPendingAttachments, entity?.sharedId, templateId]);

  useEffect(
    () => () => {
      revokePending(pendingRef.current);
    },
    []
  );

  return {
    entityAttachments,
    pendingAttachments,
    registerPendingAttachment,
    removePendingAttachment,
    clearPendingAttachments,
  };
};

export { useEntityMediaUpload };
