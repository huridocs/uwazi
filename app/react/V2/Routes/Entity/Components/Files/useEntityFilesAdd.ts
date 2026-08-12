import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { UploadService } from '#V2/api/files/index.js';
import { confirmAddFileUpload, type ConfirmAddFilePayload } from './confirmAddFileUpload.js';
import { isPdfFile } from './fileHelpers.js';

type AddFileMode = 'main' | 'translation';

type UseEntityFilesAddArgs = {
  entitySharedId: string;
  refreshEntity: () => Promise<void>;
};

const useEntityFilesAdd = ({ entitySharedId, refreshEntity }: UseEntityFilesAddArgs) => {
  const [pendingAddFile, setPendingAddFile] = useState<File | null>(null);
  const [addFileMode, setAddFileMode] = useState<AddFileMode | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileModeRef = useRef<AddFileMode | null>(null);
  const mountedRef = useRef(true);
  const uploadServiceRef = useRef<UploadService | null>(null);
  const uploadHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadHoldResolveRef = useRef<(() => void) | null>(null);

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

  const clearAddFileMode = useCallback(() => {
    setAddFileMode(null);
    addFileModeRef.current = null;
  }, []);

  const closeAddFileModal = useCallback(() => {
    setPendingAddFile(null);
    clearAddFileMode();
    setUploadProgress(null);
  }, [clearAddFileMode]);

  const syncInputAccept = useCallback((mode: AddFileMode) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = mode === 'translation' ? '.pdf,application/pdf' : '';
    }
  }, []);

  const requestAddFile = useCallback(
    (mode: AddFileMode) => {
      addFileModeRef.current = mode;
      setAddFileMode(mode);
      setPendingAddFile(null);
      setUploadProgress(null);
      syncInputAccept(mode);
    },
    [syncInputAccept]
  );

  const openAddFilePicker = useCallback(() => {
    const mode = addFileModeRef.current;
    if (!mode || !fileInputRef.current) return;
    syncInputAccept(mode);
    fileInputRef.current.click();
  }, [syncInputAccept]);

  const acceptSelectedFile = useCallback((selectedFile: File | undefined) => {
    const mode = addFileModeRef.current;
    if (!selectedFile || !mode) return;
    if (mode === 'translation' && !isPdfFile(selectedFile)) return;
    setPendingAddFile(selectedFile);
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      const input = fileInputRef.current;
      if (input) {
        input.value = '';
      }
      acceptSelectedFile(selectedFile);
    },
    [acceptSelectedFile]
  );

  const confirmAddFile = useCallback(
    async (payload: ConfirmAddFilePayload) =>
      confirmAddFileUpload(payload, {
        entitySharedId,
        mountedRef,
        uploadServiceRef,
        uploadHoldTimerRef,
        uploadHoldResolveRef,
        setUploadProgress,
        closeAddFileModal,
        refreshEntity,
      }),
    [
      closeAddFileModal,
      entitySharedId,
      mountedRef,
      refreshEntity,
      uploadHoldResolveRef,
      uploadHoldTimerRef,
      uploadServiceRef,
    ]
  );

  return {
    pendingAddFile,
    addFileMode,
    uploadProgress,
    fileInputRef,
    requestAddFile,
    openAddFilePicker,
    acceptSelectedFile,
    closeAddFileModal,
    confirmAddFile,
    handleFileInputChange,
  };
};

export { useEntityFilesAdd };
export type { AddFileMode };
