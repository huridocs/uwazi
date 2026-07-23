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

const createUploadService = (
  { file, displayName, addAs }: ConfirmAddFilePayload,
  entitySharedId: string
) => {
  const { extension } = getFileNameAndExtension(file.name);
  const originalname = extension ? `${displayName}.${extension}` : displayName;
  const service = new UploadService(addAs === 'primary' ? 'document' : 'attachment', {
    entity: entitySharedId,
    originalname,
  });
  return { service, originalname };
};

const uploadAndMaybeUpdateLanguage = async (
  service: UploadService,
  file: File,
  originalname: string,
  language?: string
): Promise<boolean> => {
  const uploaded = (await service.upload([file]))[0];
  if (!uploaded || !('_id' in uploaded)) return false;
  if (language) await update({ ...uploaded, originalname, language });
  return true;
};

const finishUploadUI = async ({
  mountedRef,
  uploadHoldTimerRef,
  uploadHoldResolveRef,
  setUploadProgress,
  closeAddFileModal,
  refreshEntity,
}: ConfirmAddFileUploadDeps) => {
  if (mountedRef.current) setUploadProgress(100);
  await holdUploadComplete(uploadHoldTimerRef, uploadHoldResolveRef);
  if (mountedRef.current) closeAddFileModal();
  await refreshEntity();
};

const cleanupUpload = (
  service: UploadService,
  { uploadServiceRef, mountedRef, setUploadProgress }: ConfirmAddFileUploadDeps
) => {
  const serviceRef = uploadServiceRef;
  if (serviceRef.current === service) serviceRef.current = null;
  if (mountedRef.current) setUploadProgress(null);
};

const confirmAddFileUpload = async (
  payload: ConfirmAddFilePayload,
  deps: ConfirmAddFileUploadDeps
): Promise<void> => {
  const { service, originalname } = createUploadService(payload, deps.entitySharedId);
  const serviceRef = deps.uploadServiceRef;
  const isMounted = deps.mountedRef;
  serviceRef.current = service;
  deps.setUploadProgress(0);
  service.onProgress((_filename, percent) => {
    if (isMounted.current) deps.setUploadProgress(percent);
  });

  try {
    const ok = await uploadAndMaybeUpdateLanguage(
      service,
      payload.file,
      originalname,
      payload.language
    );
    if (ok) await finishUploadUI(deps);
  } finally {
    cleanupUpload(service, deps);
  }
};

export { confirmAddFileUpload };
export type { ConfirmAddFilePayload, ConfirmAddFileUploadDeps };
