import { useEffect, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import { AccessLevels } from '#shared/types/permissionSchema.js';
import { useEntityContext } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { publicReadPermission, type Visibility } from './shareUtils.js';
import { useShareAssignments } from './useShareAssignments.js';
import { useShareLookup } from './useShareLookup.js';
import { useSharePermissionsLoad } from './useSharePermissionsLoad.js';

const useShareEntityModal = (sharedIds: string[], onClose: () => void) => {
  const { entities } = useServices();
  const { entity, setEntity } = useEntityContext();
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [showPublicTip, setShowPublicTip] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const generalAccessRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef(entity);
  entityRef.current = entity;
  const isPublished = visibility === 'published';

  const {
    assignments,
    assignmentsRef,
    replaceAssignments,
    updateMember,
    removeMember,
    appendMatch,
  } = useShareAssignments(setDirty);

  const { loading, loadFailed, sharedIdsRef } = useSharePermissionsLoad({
    entities,
    sharedIds,
    replaceAssignments,
    setVisibility,
    setDirty,
  });

  const lookup = useShareLookup({
    entities,
    assignmentsRef,
    appendMatch,
    loadFailed,
  });

  const controlsDisabled = loading || saving || loadFailed;

  useEffect(() => {
    if (!showPublicTip) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!generalAccessRef.current?.contains(event.target as Node)) {
        setShowPublicTip(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showPublicTip]);

  const applySavedPermissions = () => {
    const { current } = entityRef;
    setEntity({ ...current, published: isPublished });
    entityLoaderCache.invalidateEntity(current.sharedId);
    notify(t('System', 'Permissions updated', null, false), 'success');
    onClose();
  };

  const handleSave = async () => {
    if (loadFailed || loading) return;
    setSaving(true);
    const [, error] = await entities.savePermissions({
      ids: sharedIdsRef.current,
      permissions: [
        ...assignments.map(member => ({
          refId: member.refId,
          type: member.type,
          level: member.level ?? AccessLevels.READ,
        })),
        ...(isPublished ? [publicReadPermission] : []),
      ],
    });
    if (error) notify(t('System', 'An error occurred', null, false), 'error');
    else applySavedPermissions();
    setSaving(false);
  };

  const setGeneralAccess = (next: Visibility) => {
    if (loadFailed) return;
    setVisibility(next);
    setDirty(true);
    setShowPublicTip(next === 'published');
  };

  return {
    entity,
    assignments,
    visibility,
    ...lookup,
    showPublicTip,
    dirty,
    loading,
    loadFailed,
    saving,
    generalAccessRef,
    isPublished,
    controlsDisabled,
    updateMember,
    removeMember,
    handleSave,
    setGeneralAccess,
  };
};

export { useShareEntityModal };
