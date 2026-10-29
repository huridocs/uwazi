import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { UploadService } from '#V2/api/files/index.js';
import { confirmAddFilesUpload, type ConfirmAddFilePayload } from './confirmAddFileUpload.js';
import { fileQueueKey, isPdfFile } from './fileHelpers.js';

type AddFileMode = 'main' | 'translation';

type UseEntityFilesAddArgs = {
  entitySharedId: string;
  refreshEntity: () => Promise<void>;
};

const useUploadSession = () => {
  const mountedRef = useRef(true);
  const uploadServiceRef = useRef<UploadService | null>(null);
  const uploadHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadHoldResolveRef = useRef<(() => void) | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      uploadServiceRef.current?.abort();
      uploadServiceRef.current = null;
      if (uploadHoldTimerRef.current) {
        clearTimeout(uploadHoldTimerRef.current);
        uploadHoldTimerRef.current = null;
      }
      const settleHold = uploadHoldResolveRef.current;
      uploadHoldResolveRef.current = null;
      settleHold?.();
    };
  }, []);

  return {
    mountedRef,
    uploadServiceRef,
    uploadHoldTimerRef,
    uploadHoldResolveRef,
    uploadProgress,
    setUploadProgress,
  };
};

const useAddFileMode = ({
  fileInputRef,
  addFileModeRef,
  setPendingAddFiles,
  setUploadProgress,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  addFileModeRef: RefObject<AddFileMode | null>;
  setPendingAddFiles: Dispatch<SetStateAction<File[]>>;
  setUploadProgress: (value: number | null) => void;
}) => {
  const [addFileMode, setAddFileMode] = useState<AddFileMode | null>(null);

  const syncInputAccept = useCallback(
    (mode: AddFileMode) => {
      if (fileInputRef.current) {
        fileInputRef.current.multiple = true;
        fileInputRef.current.accept = mode === 'translation' ? '.pdf,application/pdf' : '';
      }
    },
    [fileInputRef]
  );

  const clearAddFileMode = useCallback(() => {
    setAddFileMode(null);
    addFileModeRef.current = null;
  }, [addFileModeRef]);

  const requestAddFile = useCallback(
    (mode: AddFileMode) => {
      addFileModeRef.current = mode;
      setAddFileMode(mode);
      setPendingAddFiles([]);
      setUploadProgress(null);
      syncInputAccept(mode);
    },
    [addFileModeRef, setPendingAddFiles, setUploadProgress, syncInputAccept]
  );

  const openAddFilePicker = useCallback(() => {
    const mode = addFileModeRef.current;
    if (!mode || !fileInputRef.current) return;
    syncInputAccept(mode);
    fileInputRef.current.click();
  }, [addFileModeRef, fileInputRef, syncInputAccept]);

  return { addFileMode, clearAddFileMode, requestAddFile, openAddFilePicker };
};

const usePendingAddFiles = (
  fileInputRef: RefObject<HTMLInputElement | null>,
  addFileModeRef: RefObject<AddFileMode | null>
) => {
  const [pendingAddFiles, setPendingAddFiles] = useState<File[]>([]);

  const acceptSelectedFiles = useCallback(
    (selectedFiles: File[]) => {
      const mode = addFileModeRef.current;
      if (!mode || selectedFiles.length === 0) return;
      const accepted = mode === 'translation' ? selectedFiles.filter(isPdfFile) : selectedFiles;
      if (accepted.length === 0) return;
      setPendingAddFiles(current => {
        const seen = new Set(current.map(fileQueueKey));
        const added = accepted.filter(file => !seen.has(fileQueueKey(file)));
        return added.length === 0 ? current : [...current, ...added];
      });
    },
    [addFileModeRef]
  );

  const removePendingAddFile = useCallback((file: File) => {
    const key = fileQueueKey(file);
    setPendingAddFiles(current => current.filter(item => fileQueueKey(item) !== key));
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
      const input = fileInputRef.current;
      if (input) input.value = '';
      acceptSelectedFiles(selectedFiles);
    },
    [acceptSelectedFiles, fileInputRef]
  );

  return {
    pendingAddFiles,
    setPendingAddFiles,
    acceptSelectedFiles,
    removePendingAddFile,
    handleFileInputChange,
  };
};

const useEntityFilesAdd = ({ entitySharedId, refreshEntity }: UseEntityFilesAddArgs) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileModeRef = useRef<AddFileMode | null>(null);
  const {
    mountedRef,
    uploadServiceRef,
    uploadHoldTimerRef,
    uploadHoldResolveRef,
    uploadProgress,
    setUploadProgress,
  } = useUploadSession();
  const {
    pendingAddFiles,
    setPendingAddFiles,
    acceptSelectedFiles,
    removePendingAddFile,
    handleFileInputChange,
  } = usePendingAddFiles(fileInputRef, addFileModeRef);
  const { addFileMode, clearAddFileMode, requestAddFile, openAddFilePicker } = useAddFileMode({
    fileInputRef,
    addFileModeRef,
    setPendingAddFiles,
    setUploadProgress,
  });

  const closeAddFileModal = useCallback(() => {
    setPendingAddFiles([]);
    clearAddFileMode();
    setUploadProgress(null);
  }, [clearAddFileMode, setPendingAddFiles, setUploadProgress]);

  const confirmAddFile = useCallback(
    async (payloads: ConfirmAddFilePayload[]) => {
      const uploaded = await confirmAddFilesUpload(payloads, {
        entitySharedId,
        mountedRef,
        uploadServiceRef,
        uploadHoldTimerRef,
        uploadHoldResolveRef,
        setUploadProgress,
        closeAddFileModal,
        refreshEntity,
      });
      if (uploaded > 0 && uploaded < payloads.length) {
        const done = new Set(payloads.slice(0, uploaded).map(item => fileQueueKey(item.file)));
        setPendingAddFiles(current => current.filter(file => !done.has(fileQueueKey(file))));
      }
      return uploaded;
    },
    [
      closeAddFileModal,
      entitySharedId,
      mountedRef,
      refreshEntity,
      setPendingAddFiles,
      setUploadProgress,
      uploadHoldResolveRef,
      uploadHoldTimerRef,
      uploadServiceRef,
    ]
  );

  return {
    pendingAddFiles,
    addFileMode,
    uploadProgress,
    fileInputRef,
    requestAddFile,
    openAddFilePicker,
    acceptSelectedFiles,
    removePendingAddFile,
    closeAddFileModal,
    confirmAddFile,
    handleFileInputChange,
  };
};

export { useEntityFilesAdd };
export type { AddFileMode };
