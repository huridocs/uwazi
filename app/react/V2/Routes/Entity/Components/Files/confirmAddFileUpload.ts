import type { RefObject } from 'react';
import { t } from '#app/I18N/index.js';
import { update, UploadService } from '#V2/api/files/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
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
  mountedRef: RefObject<boolean>;
  uploadServiceRef: RefObject<UploadService | null>;
  uploadHoldTimerRef: RefObject<ReturnType<typeof setTimeout> | null>;
  uploadHoldResolveRef: RefObject<(() => void) | null>;
  setUploadProgress: (value: number | null) => void;
  closeAddFileModal: () => void;
  refreshEntity: () => Promise<void>;
};

const holdUploadComplete = async (
  uploadHoldTimerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  uploadHoldResolveRef: RefObject<(() => void) | null>
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
  { file, language }: ConfirmAddFilePayload,
  originalname: string
): Promise<boolean> => {
  const [uploaded] = await service.upload([file]);
  if (!uploaded || !('_id' in uploaded)) return false;
  if (language) {
    try {
      await update({ ...uploaded, originalname, language });
    } catch {
      return true;
    }
  }
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

const uploadPayload = async (payload: ConfirmAddFilePayload, deps: ConfirmAddFileUploadDeps) => {
  const { service, originalname } = createUploadService(payload, deps.entitySharedId);
  const serviceRef = deps.uploadServiceRef;
  const isMounted = deps.mountedRef;
  serviceRef.current = service;
  deps.setUploadProgress(0);
  service.onProgress((_filename, percent) => {
    if (isMounted.current) deps.setUploadProgress(percent);
  });

  try {
    return await uploadAndMaybeUpdateLanguage(service, payload, originalname);
  } catch {
    return false;
  } finally {
    cleanupUpload(service, deps);
  }
};

const confirmAddFilesUpload = async (
  payloads: ConfirmAddFilePayload[],
  deps: ConfirmAddFileUploadDeps
): Promise<number> => {
  const uploaded = await payloads.reduce(async (previous, payload, index) => {
    const count = await previous;
    if (count < index) return count;
    const ok = await uploadPayload(payload, deps);
    return ok ? count + 1 : count;
  }, Promise.resolve(0));
  if (uploaded === payloads.length && uploaded > 0) await finishUploadUI(deps);
  else if (uploaded > 0) await deps.refreshEntity();
  else if (payloads.length > 0) notify(t('System', 'Something went wrong', null, false), 'error');
  return uploaded;
};

export { confirmAddFilesUpload };
export type { ConfirmAddFilePayload, ConfirmAddFileUploadDeps };
