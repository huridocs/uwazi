import { useCallback, useEffect, useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router';
import { atom, useAtom, useSetAtom } from 'jotai';
import { t } from '#app/I18N/index.js';
import { deletedEntityAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices, type EntitiesService } from '#V2/services/index.js';

type Notify = ReturnType<typeof useRequestStatus>['notify'];

type RunDeleteEntityArgs = {
  deleteEntity: EntitiesService['delete'];
  sharedId: string;
  notify: Notify;
  setDeletedEntity: (sharedId: string) => void;
  navigate: NavigateFunction;
  onFail: () => void;
};

const runDeleteEntity = async ({
  deleteEntity,
  sharedId,
  notify,
  setDeletedEntity,
  navigate,
  onFail,
}: RunDeleteEntityArgs) => {
  const [, error] = await deleteEntity([sharedId]);
  if (error) {
    notify(
      'error',
      t('System', 'An error occurred', null, false),
      undefined,
      error.detail ?? error.message
    );
    onFail();
    return;
  }
  notify('success', t('System', 'Entity deleted', null, false));
  entityLoaderCache.invalidateEntity(sharedId);
  setDeletedEntity(sharedId);
  await navigate(-1);
};

const entityDeleteInFlightRef = { current: false };
const entityDeleteInFlightAtom = atom(false);
let entityDeleteSubscribers = 0;

const useDeleteEntity = () => {
  const entity = useEntityScopedEntity();
  const { entities } = useServices();
  const { notify } = useRequestStatus();
  const navigate = useNavigate();
  const setDeletedEntity = useSetAtom(deletedEntityAtom);
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useAtom(entityDeleteInFlightAtom);

  useEffect(() => {
    entityDeleteSubscribers += 1;
    return () => {
      entityDeleteSubscribers -= 1;
      if (entityDeleteSubscribers === 0) {
        entityDeleteInFlightRef.current = false;
        setIsDeleting(false);
      }
    };
  }, [setIsDeleting]);

  const requestDelete = () => {
    if (!isDeleting) setConfirming(true);
  };

  const cancelDelete = () => {
    if (!isDeleting) setConfirming(false);
  };

  const confirmDelete = useCallback(async () => {
    if (entityDeleteInFlightRef.current) return;
    entityDeleteInFlightRef.current = true;
    setIsDeleting(true);
    await runDeleteEntity({
      deleteEntity: entities.delete,
      sharedId: entity.sharedId,
      notify,
      setDeletedEntity,
      navigate,
      onFail: () => {
        entityDeleteInFlightRef.current = false;
        setIsDeleting(false);
      },
    });
  }, [entities.delete, entity.sharedId, navigate, notify, setDeletedEntity, setIsDeleting]);

  return { confirming, isDeleting, requestDelete, cancelDelete, confirmDelete };
};

export { useDeleteEntity };
