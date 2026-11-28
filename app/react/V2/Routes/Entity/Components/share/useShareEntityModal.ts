import { useEffect, useRef, useState, type RefObject } from 'react';
import { t } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useEntityContext } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { useServices } from '#V2/services/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { permissionsToSave, singleEntityHasMixedMember, type Visibility } from './shareUtils.js';
import { useShareAssignments } from './useShareAssignments.js';
import { useShareLookup } from './useShareLookup.js';
import { useSharePermissionsLoad } from './useSharePermissionsLoad.js';

type ShareSources = {
  entities: EntitiesService;
  sharedIds: string[];
  setDirty: (value: boolean) => void;
  setVisibility: (value: Visibility) => void;
};

type SavePermissionsInput = {
  entities: EntitiesService;
  entity: Entity;
  setEntity: (entity: Entity) => void;
  onClose: () => void;
  visibility: Visibility;
  loadFailed: boolean;
  loading: boolean;
  setSaving: (value: boolean) => void;
  assignments: MemberWithPermission[];
  sharedIdsRef: RefObject<string[]>;
};

const useDialogState = () => {
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [showPublicTip, setShowPublicTip] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const generalAccessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPublicTip) return undefined;
    const onPointerDown = ({ target }: PointerEvent) => {
      if (target instanceof Node && !generalAccessRef.current?.contains(target)) {
        setShowPublicTip(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showPublicTip]);

  return {
    visibility,
    setVisibility,
    showPublicTip,
    setShowPublicTip,
    dirty,
    setDirty,
    saving,
    setSaving,
    generalAccessRef,
  };
};

const useSharing = ({ entities, sharedIds, setDirty, setVisibility }: ShareSources) => {
  const assignmentState = useShareAssignments(setDirty);
  const loaded = useSharePermissionsLoad({
    entities,
    sharedIds,
    replaceAssignments: assignmentState.replaceAssignments,
    setVisibility,
    setDirty,
  });
  const lookup = useShareLookup({
    entities,
    assignmentsRef: assignmentState.assignmentsRef,
    appendMatch: assignmentState.appendMatch,
    loadFailed: loaded.loadFailed,
  });

  return { assignmentState, loaded, lookup };
};

const useSavePermissions = ({
  entities,
  entity,
  setEntity,
  onClose,
  visibility,
  loadFailed,
  loading,
  setSaving,
  assignments,
  sharedIdsRef,
}: SavePermissionsInput) => {
  const entityRef = useRef(entity);
  entityRef.current = entity;

  const applySavedPermissions = () => {
    const { current } = entityRef;
    if (visibility !== 'mixed') setEntity({ ...current, published: visibility === 'published' });
    new Set([current.sharedId, ...sharedIdsRef.current]).forEach(id =>
      entityLoaderCache.invalidateEntity(id)
    );
    notify(t('System', 'Permissions updated', null, false), 'success');
    onClose();
  };

  const handleSave = async () => {
    if (loadFailed || loading || singleEntityHasMixedMember(sharedIdsRef.current, assignments)) {
      return;
    }
    setSaving(true);
    const [, error] = await entities.savePermissions({
      ids: sharedIdsRef.current,
      permissions: permissionsToSave(assignments, visibility),
    });
    if (error) notify(t('System', 'An error occurred', null, false), 'error');
    else applySavedPermissions();
    setSaving(false);
  };

  return handleSave;
};

const useShareEntityModal = (sharedIds: string[], onClose: () => void) => {
  const { entities } = useServices();
  const { entity, setEntity } = useEntityContext();
  const dialog = useDialogState();
  const { assignmentState, loaded, lookup } = useSharing({
    entities,
    sharedIds,
    setDirty: dialog.setDirty,
    setVisibility: dialog.setVisibility,
  });
  const controlsDisabled = loaded.loading || dialog.saving || loaded.loadFailed;
  const handleSave = useSavePermissions({
    entities,
    entity,
    setEntity,
    onClose,
    visibility: dialog.visibility,
    loadFailed: loaded.loadFailed,
    loading: loaded.loading,
    setSaving: dialog.setSaving,
    assignments: assignmentState.assignments,
    sharedIdsRef: loaded.sharedIdsRef,
  });
  const setGeneralAccess = (next: Visibility) => {
    if (loaded.loadFailed) return;
    dialog.setVisibility(next);
    dialog.setDirty(true);
    dialog.setShowPublicTip(next === 'published');
  };

  return {
    entity,
    controlsDisabled,
    generalAccess: {
      visibility: dialog.visibility,
      showPublicTip: dialog.showPublicTip,
      generalAccessRef: dialog.generalAccessRef,
      setGeneralAccess,
    },
    lookup,
    members: {
      assignments: assignmentState.assignments,
      loading: loaded.loading,
      loadFailed: loaded.loadFailed,
      updateMember: assignmentState.updateMember,
      removeMember: assignmentState.removeMember,
    },
    footer: {
      dirty: dialog.dirty,
      saving: dialog.saving,
      loading: loaded.loading,
      loadFailed: loaded.loadFailed,
      unresolvedMixed: singleEntityHasMixedMember(sharedIds, assignmentState.assignments),
      handleSave,
    },
  };
};

export { useShareEntityModal };
