import { useEffect, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { findPublic, type Visibility } from './shareUtils.js';

type LoadDeps = {
  entities: EntitiesService;
  sharedIds: string[];
  replaceAssignments: (next: MemberWithPermission[]) => void;
  setVisibility: (value: Visibility) => void;
  setDirty: (value: boolean) => void;
};

const useSharePermissionsLoad = ({
  entities,
  sharedIds,
  replaceAssignments,
  setVisibility,
  setDirty,
}: LoadDeps) => {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const sharedIdsRef = useRef(sharedIds);
  const sharedIdsKey = JSON.stringify(sharedIds);
  sharedIdsRef.current = sharedIds;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setDirty(false);

    const failLoad = () => {
      if (cancelled) return;
      setLoadFailed(true);
      notify(t('System', 'An error occurred', null, false), 'error');
      setLoading(false);
    };

    const load = async () => {
      const [permissions, error] = await entities.getPermissions(sharedIdsRef.current);
      if (cancelled) return;
      if (error || !permissions) {
        failLoad();
        return;
      }
      setVisibility(findPublic(permissions) ? 'published' : 'private');
      replaceAssignments(permissions.filter(p => p.type !== PermissionType.PUBLIC));
      setLoading(false);
    };

    load().catch(failLoad);

    return () => {
      cancelled = true;
    };
  }, [entities, sharedIdsKey, replaceAssignments, setVisibility, setDirty]);

  return { loading, loadFailed, sharedIdsRef };
};

export { useSharePermissionsLoad };
