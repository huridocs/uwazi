import type { MutableRefObject } from 'react';
import { update, UploadService } from '#V2/api/files/index.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';

const UPLOAD_COMPLETE_HOLD_MS = 500;

type ConfirmAddFilePayload = {
  file: File;
  displayName: string;
  addAs: 'supporting' | 'primary';
  language?: string;
};

type ConfirmAddFileUploadDeps = {
  entitySharedId: string;
  mountedRef: MutableRefObject<boolean>;
  uploadServiceRef: MutableRefObject<UploadService | null>;
  uploadHoldTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  uploadHoldResolveRef: MutableRefObject<(() => void) | null>;
  setUploadProgress: (value: number | null) => void;
  closeAddFileModal: () => void;
  refreshEntity: () => Promise<void>;
};

const holdUploadComplete = async (
  uploadHoldTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  uploadHoldResolveRef: MutableRefObject<(() => void) | null>
) => {
  const timerRef = uploadHoldTimerRef;
  const resolveRef = uploadHoldResolveRef;
  return new Promise<void>(resolve => {
    resolveRef.current = resolve;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      resolveRef.current = null;
      resolve();
    }, UPLOAD_COMPLETE_HOLD_MS);
  });
};

const confirmAddFileUpload = async (
  { file, displayName, addAs, language }: ConfirmAddFilePayload,
  {
    entitySharedId,
    mountedRef,
    uploadServiceRef,
    uploadHoldTimerRef,
    uploadHoldResolveRef,
    setUploadProgress,
    closeAddFileModal,
    refreshEntity,
  }: ConfirmAddFileUploadDeps
): Promise<void> => {
  const serviceRef = uploadServiceRef;
  const isMounted = mountedRef;
  const { extension } = getFileNameAndExtension(file.name);
  const originalname = extension ? `${displayName}.${extension}` : displayName;
  const endpoint = addAs === 'primary' ? 'document' : 'attachment';
  const service = new UploadService(endpoint, {
    entity: entitySharedId,
    originalname,
  });
  serviceRef.current = service;
  setUploadProgress(0);
  service.onProgress((_filename, percent) => {
    if (!isMounted.current) return;
    setUploadProgress(percent);
  });

  try {
    const responses = await service.upload([file]);
    const uploaded = responses[0];

    if (!uploaded || !('_id' in uploaded)) {
      return;
    }

    if (language) {
      await update({ ...uploaded, originalname, language });
    }

    if (isMounted.current) {
      setUploadProgress(100);
    }
    await holdUploadComplete(uploadHoldTimerRef, uploadHoldResolveRef);

    if (isMounted.current) {
      closeAddFileModal();
    }
    await refreshEntity();
  } finally {
    if (serviceRef.current === service) {
      serviceRef.current = null;
    }
    if (isMounted.current) {
      setUploadProgress(null);
    }
  }
};

export { confirmAddFileUpload };
export type { ConfirmAddFilePayload, ConfirmAddFileUploadDeps };
