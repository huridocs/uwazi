import { useEffect, useRef } from 'react';
import { socket } from '#app/socket.js';
import { useMetadataEditing } from '../context/MetadataEditingContext.js';
import { shouldSkipEntityFilesRefresh } from './shouldSkipEntityFilesRefresh.js';

type UseEntityFilesSocketRefreshArgs = {
  sharedId: string;
  isFileEditing: boolean;
  refreshEntity: () => Promise<void>;
};

const useEntityFilesSocketRefresh = ({
  sharedId,
  isFileEditing,
  refreshEntity,
}: UseEntityFilesSocketRefreshArgs) => {
  const { isEditing: isMetadataEditing, isDirty: isMetadataDirty } = useMetadataEditing();
  const isFileEditingRef = useRef(false);
  const isMetadataEditingRef = useRef(false);
  const isMetadataDirtyRef = useRef(false);

  isFileEditingRef.current = isFileEditing;
  isMetadataEditingRef.current = isMetadataEditing;
  isMetadataDirtyRef.current = isMetadataDirty;

  useEffect(() => {
    const onEntityEvent = (eventSharedId: string) => {
      if (
        eventSharedId !== sharedId ||
        shouldSkipEntityFilesRefresh({
          isFileEditing: isFileEditingRef.current,
          isMetadataEditing: isMetadataEditingRef.current,
          isMetadataDirty: isMetadataDirtyRef.current,
        })
      ) {
        return;
      }
      refreshEntity().catch(() => undefined);
    };

    socket.on('documentProcessed', onEntityEvent);
    socket.on('conversionFailed', onEntityEvent);

    return () => {
      socket.off('documentProcessed', onEntityEvent);
      socket.off('conversionFailed', onEntityEvent);
    };
  }, [sharedId, refreshEntity]);
};

export { useEntityFilesSocketRefresh };
