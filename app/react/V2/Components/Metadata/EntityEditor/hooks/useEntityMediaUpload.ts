import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClientFile } from '#app/istore.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';
import { revokeHTMLMediaView } from '#shared/fileUploadUtils.js';

const useEntityMediaUpload = (entity?: Entity) => {
  const [pendingAttachments, setPendingAttachments] = useState<ClientFile[]>([]);

  const entityAttachments = useMemo(
    () => [...(entity?.attachments ?? []), ...(entity?.documents ?? [])],
    [entity?.attachments, entity?.documents]
  );

  const allAttachments = useMemo(
    () => [...entityAttachments, ...pendingAttachments] as Array<FileType | ClientFile>,
    [entityAttachments, pendingAttachments]
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

  useEffect(() => {
    setPendingAttachments(current => {
      current.forEach(attachment => {
        if (attachment.fileLocalID) {
          revokeHTMLMediaView(attachment.fileLocalID);
        }
      });
      return [];
    });
  }, [entity?.sharedId]);

  return {
    allAttachments,
    entityAttachments,
    pendingAttachments,
    registerPendingAttachment,
    removePendingAttachment,
  };
};

export { useEntityMediaUpload };
