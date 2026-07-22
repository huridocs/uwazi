import { useEffect, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { useEntityContext } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  exactCollaboratorMatches,
  findPublic,
  publicReadPermission,
  type Visibility,
} from './shareUtils.js';

const errorOccurred = () => t('System', 'An error occurred', null, false);

// eslint-disable-next-line max-statements
const useShareEntityModal = (sharedIds: string[], onClose: () => void) => {
  const { entities } = useServices();
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
  const entityRef = useRef(entity);
  const sharedIdsRef = useRef(sharedIds);
  const sharedIdsKey = JSON.stringify(sharedIds);
  entityRef.current = entity;
  sharedIdsRef.current = sharedIds;
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
    setDirty(false);

    const failLoad = () => {
      if (cancelled) return;
      setLoadFailed(true);
      notify(errorOccurred(), 'error');
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
      setAssignments(permissions.filter(p => p.type !== PermissionType.PUBLIC));
      setLoading(false);
    };

    load().catch(failLoad);

    return () => {
      cancelled = true;
    };
  }, [entities, sharedIdsKey]);

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

  const findMatches = async (term: string) => {
    const [results, error] = await entities.searchCollaborators(term);
    if (error || !results) return undefined;
    return exactCollaboratorMatches(term, results, assignments);
  };

  const appendMatch = (match: MemberWithPermission) => {
    setAssignments(prev => [...prev, { ...match, level: match.level || AccessLevels.READ }]);
    setLookupTerm('');
    setDirty(true);
  };

  const lookupMatchError = (matches: MemberWithPermission[] | undefined) => {
    if (matches === undefined) return errorOccurred();
    if (matches.length === 0) return t('System', 'No user or group found', null, false);
    if (matches.length > 1) return t('System', 'Multiple matches found', null, false);
    return '';
  };

  const handleAdd = async () => {
    const term = lookupTerm.trim();
    if (!term || adding || loadFailed) return;

    setAdding(true);
    setLookupError('');
    const matches = await findMatches(term);
    const error = lookupMatchError(matches);
    if (error) setLookupError(error);
    else if (matches?.[0]) appendMatch(matches[0]);
    setAdding(false);
  };

  const buildPermissions = () => [
    ...assignments.map(member => ({
      refId: member.refId,
      type: member.type,
      level: member.level ?? AccessLevels.READ,
    })),
    ...(isPublished ? [publicReadPermission] : []),
  ];

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
      permissions: buildPermissions(),
    });
    if (error) notify(errorOccurred(), 'error');
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
