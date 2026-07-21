import { useEffect, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import {
  loadGrantedPermissions,
  savePermissions,
  searchCollaborators,
} from '#app/Permissions/PermissionsAPI.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { useEntityContext } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  exactCollaboratorMatches,
  findPublic,
  publicReadPermission,
  type Visibility,
} from './shareUtils.js';

const useShareEntityModal = (sharedIds: string[], onClose: () => void) => {
  const { entity, setEntity } = useEntityContext();
  const [assignments, setAssignments] = useState<MemberWithPermission[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [showLookupHint, setShowLookupHint] = useState(false);
  const [showPublicTip, setShowPublicTip] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const generalAccessRef = useRef<HTMLDivElement>(null);
  const lookupInputRef = useRef<HTMLInputElement>(null);
  const isPublished = visibility === 'published';
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

  useEffect(() => {
    if (lookupError && !adding) lookupInputRef.current?.focus();
  }, [lookupError, adding]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    loadGrantedPermissions(sharedIds)
      .then(permissions => {
        if (cancelled) return;
        setVisibility(findPublic(permissions) ? 'published' : 'private');
        setAssignments(permissions.filter(p => p.type !== PermissionType.PUBLIC));
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          notify(t('System', 'An error occurred', null, false), 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sharedIds]);

  const updateMember = (index: number, level: MixedAccessLevels) => {
    setAssignments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], level };
      return next;
    });
    setDirty(true);
  };

  const removeMember = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const findMatches = async (term: string) =>
    exactCollaboratorMatches(term, await searchCollaborators(term), assignments);

  const appendMatches = (matches: MemberWithPermission[]) => {
    setAssignments(prev => [
      ...prev,
      ...matches.map(m => ({ ...m, level: m.level || AccessLevels.READ })),
    ]);
    setLookupTerm('');
    setDirty(true);
  };

  const handleAdd = async () => {
    const term = lookupTerm.trim();
    if (!term || adding || loadFailed) return;

    setAdding(true);
    setLookupError('');
    try {
      const matches = await findMatches(term);
      if (!matches.length) setLookupError(t('System', 'No user or group found', null, false));
      else appendMatches(matches);
    } catch {
      setLookupError(t('System', 'An error occurred', null, false));
    } finally {
      setAdding(false);
    }
  };

  const buildPermissions = () => [
    ...assignments.map(member => ({
      refId: member.refId,
      type: member.type,
      level: member.level ?? AccessLevels.READ,
    })),
    ...(isPublished ? [publicReadPermission] : []),
  ];

  const handleSave = async () => {
    if (loadFailed || loading) return;
    setSaving(true);
    try {
      await savePermissions({ ids: sharedIds, permissions: buildPermissions() });
      setEntity({ ...entity, published: isPublished });
      entityLoaderCache.invalidateEntity(entity.sharedId);
      notify(t('System', 'Permissions updated', null, false), 'success');
      onClose();
    } catch {
      notify(t('System', 'An error occurred', null, false), 'error');
    } finally {
      setSaving(false);
    }
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
    lookupTerm,
    lookupError,
    showLookupHint,
    showPublicTip,
    dirty,
    loading,
    loadFailed,
    saving,
    adding,
    generalAccessRef,
    lookupInputRef,
    isPublished,
    controlsDisabled,
    updateMember,
    removeMember,
    handleAdd,
    handleSave,
    setGeneralAccess,
    setLookupTerm,
    setLookupError,
    setShowLookupHint,
  };
};

export { useShareEntityModal };
