/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import {
  loadGrantedPermissions,
  savePermissions,
  searchCollaborators,
} from '#app/Permissions/PermissionsAPI.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import {
  AccessLevels,
  MixedAccess,
  MixedAccessLevels,
  PermissionType,
} from '#shared/types/permissionSchema.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Button, Modal, NeedAuthorization, Tooltip } from '#V2/Components/UI/index.js';
import {
  SegmentedControlItem,
  SegmentedControlRoot,
} from '#V2/Components/UI/SegmentedControl/index.js';
import { useEntityContext } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { notify } from '#V2/utils/notifyBridge.js';

type Visibility = 'private' | 'published';

type ShareEntityModalProps = {
  sharedIds: string[];
  onClose: () => void;
};

const publicReadPermission = {
  refId: 'public',
  type: PermissionType.PUBLIC,
  level: AccessLevels.READ as MixedAccessLevels,
};

const findPublic = (permissions: MemberWithPermission[]) =>
  permissions.find(p => p.type === PermissionType.PUBLIC);

const memberKey = (member: MemberWithPermission) => `${member.type}:${member.refId}`;

const exactCollaboratorMatches = (
  term: string,
  results: MemberWithPermission[],
  assignments: MemberWithPermission[]
) => {
  const normalized = term.trim().toLowerCase();
  return results.filter(result => {
    if (result.type === PermissionType.PUBLIC) return false;
    if (assignments.some(a => a.refId === result.refId && a.type === result.type)) return false;
    if (result.type === PermissionType.GROUP) {
      return result.label.toLowerCase() === normalized;
    }
    return true;
  });
};

const hintClass =
  'rounded-md border border-border bg-paper px-2.5 py-1.5 text-[10px] font-medium leading-snug text-ink';

const actionBtnClass = (active: boolean, disabled: boolean, danger = false) => {
  const base =
    'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30';
  if (disabled) return `${base} cursor-not-allowed text-ink-muted opacity-40`;
  if (danger) {
    return `${base} cursor-pointer text-ink-tertiary hover:bg-seal-tint hover:text-seal`;
  }
  if (active) return `${base} cursor-pointer bg-vellum text-ink`;
  return `${base} cursor-pointer text-ink-tertiary hover:bg-warm hover:text-ink-secondary`;
};

const ActionSlot = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center">{children}</div>
);

const MemberActions = ({ children }: { children: React.ReactNode }) => (
  <div className="flex shrink-0 items-center">{children}</div>
);

const MemberRow = ({
  member,
  onChange,
  onRemove,
  showCanSee = true,
}: {
  member: MemberWithPermission;
  onChange: (level: MixedAccessLevels) => void;
  onRemove: () => void;
  showCanSee?: boolean;
}) => {
  const level = member.level ?? AccessLevels.READ;
  const isMixed = level === MixedAccess.MIXED;
  const canSee = level === AccessLevels.READ || isMixed;
  const canEdit = level === AccessLevels.WRITE || isMixed;

  return (
    <div className="flex items-center gap-3 px-1 pb-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{member.label}</span>
      <MemberActions>
        <div
          className="flex items-center gap-0.5"
          role="group"
          aria-label={t('System', 'Permission level', null, false)}
        >
          {showCanSee ? (
            <ActionSlot>
              <Tooltip content={t('System', 'Can see', null, false)} placement="top">
                <button
                  type="button"
                  aria-label={t('System', 'Can see', null, false)}
                  aria-pressed={canSee && !isMixed}
                  className={actionBtnClass(canSee, false)}
                  onClick={() => onChange(AccessLevels.READ)}
                >
                  <EyeIcon className="h-4 w-4" aria-hidden />
                </button>
              </Tooltip>
            </ActionSlot>
          ) : null}
          <ActionSlot>
            <Tooltip content={t('System', 'Can edit', null, false)} placement="top">
              <button
                type="button"
                aria-label={t('System', 'Can edit', null, false)}
                aria-pressed={canEdit && !isMixed}
                className={actionBtnClass(canEdit, false)}
                onClick={() =>
                  onChange(
                    showCanSee || !canEdit || isMixed ? AccessLevels.WRITE : AccessLevels.READ
                  )
                }
              >
                <PencilSquareIcon className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          </ActionSlot>
        </div>
        <div className="ms-2 border-s border-border ps-2">
          <ActionSlot>
            <Tooltip content={t('System', 'Remove', null, false)} placement="top">
              <button
                type="button"
                aria-label={t('System', 'Remove', null, false)}
                className={actionBtnClass(false, false, true)}
                onClick={onRemove}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          </ActionSlot>
        </div>
      </MemberActions>
    </div>
  );
};

const ShareEntityModal = ({ sharedIds, onClose }: ShareEntityModalProps) => {
  const { entity, setEntity } = useEntityContext();
  const [assignments, setAssignments] = useState<MemberWithPermission[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [showLookupHint, setShowLookupHint] = useState(false);
  const [showPublicTip, setShowPublicTip] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const generalAccessRef = useRef<HTMLDivElement>(null);
  const lookupInputRef = useRef<HTMLInputElement>(null);
  const publicTipId = 'share-public-caution';

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
    if (lookupError && !adding) {
      lookupInputRef.current?.focus();
    }
  }, [lookupError, adding]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadGrantedPermissions(sharedIds)
      .then(permissions => {
        if (cancelled) return;
        const publicPermission = findPublic(permissions);
        setVisibility(publicPermission ? 'published' : 'private');
        setAssignments(permissions.filter(p => p.type !== PermissionType.PUBLIC));
      })
      .catch(() => {
        if (!cancelled) {
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

  const isPublished = visibility === 'published';

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

  const handleAdd = async () => {
    const term = lookupTerm.trim();
    if (!term || adding) return;

    setAdding(true);
    setLookupError('');
    try {
      const results = await searchCollaborators(term);
      const matches = exactCollaboratorMatches(term, results, assignments);
      if (matches.length === 0) {
        setLookupError(t('System', 'No user or group found', null, false));
        return;
      }
      setAssignments(prev => [
        ...prev,
        ...matches.map(match => ({
          ...match,
          level: match.level || AccessLevels.READ,
        })),
      ]);
      setLookupTerm('');
      setDirty(true);
    } catch {
      setLookupError(t('System', 'An error occurred', null, false));
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = [
        ...assignments.map(member => ({
          refId: member.refId,
          type: member.type,
          level: (member.level || AccessLevels.READ) as MixedAccessLevels,
        })),
        ...(isPublished ? [publicReadPermission] : []),
      ];
      await savePermissions({ ids: sharedIds, permissions });
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
    setVisibility(next);
    setDirty(true);
    setShowPublicTip(next === 'published');
  };

  return (
    <Modal size="lg" ariaLabel={t('System', 'Share', null, false)}>
      <Modal.Header>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">
            <Translate>Share</Translate>
          </h3>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{entity.title}</p>
        </div>
        <Modal.CloseButton onClick={onClose} disabled={saving} className="!ml-0" />
      </Modal.Header>

      <Modal.Body className="!px-0 !py-0">
        <NeedAuthorization roles={['admin', 'editor']}>
          <section className="space-y-2 border-b border-border/50 px-5 pt-3 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-medium text-ink-secondary">
                <Translate>General access</Translate>
              </h4>
              <div ref={generalAccessRef} className="relative">
                <SegmentedControlRoot
                  ariaLabel={t('System', 'General access', null, false)}
                  disabled={loading || saving}
                  value={visibility}
                  onValueChange={next => setGeneralAccess(next as Visibility)}
                >
                  <SegmentedControlItem
                    value="private"
                    ariaLabel={t('System', 'Private', null, false)}
                    className="gap-1.5 px-2.5"
                  >
                    <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">
                      <Translate>Private</Translate>
                    </span>
                  </SegmentedControlItem>
                  <SegmentedControlItem
                    value="published"
                    ariaLabel={t('System', 'Published', null, false)}
                    ariaDescribedBy={showPublicTip ? publicTipId : undefined}
                    className={`gap-1.5 px-2.5 ${
                      isPublished ? '!bg-ink !text-parchment [&_svg]:!text-parchment' : ''
                    }`}
                  >
                    <GlobeAltIcon className="h-3 w-3 shrink-0" aria-hidden />
                    <span className={`whitespace-nowrap ${isPublished ? 'text-parchment' : ''}`}>
                      <Translate>Published</Translate>
                    </span>
                  </SegmentedControlItem>
                </SegmentedControlRoot>
                {showPublicTip ? (
                  <div
                    id={publicTipId}
                    role="tooltip"
                    className={`pointer-events-none absolute end-0 top-full z-20 mt-1.5 w-56 ${hintClass}`}
                  >
                    <Translate translationKey="Public entities description">
                      Caution: the selected entities will be **public**. Anyone will be able to see
                      them.
                    </Translate>
                  </div>
                ) : null}
              </div>
            </div>
            <p className="flex items-center gap-1 text-[10px] leading-tight text-ink-secondary">
              <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
              <Translate>Administrators and Editors always have edit access</Translate>
            </p>
            {isPublished && !showPublicTip ? (
              <p className="flex items-center gap-1 text-[10px] leading-tight text-ink-secondary">
                <ExclamationTriangleIcon className="h-3 w-3 shrink-0 text-warning" aria-hidden />
                <Translate>Anyone can see this entity</Translate>
              </p>
            ) : null}
          </section>
        </NeedAuthorization>

        <section className="space-y-3 px-5 pt-3">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-medium text-ink-secondary">
              <Translate>People and groups</Translate>
            </h4>
            <button
              type="button"
              aria-label={t('System', 'Lookup help', null, false)}
              aria-expanded={showLookupHint}
              aria-controls="share-lookup-hint"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-warm hover:text-ink-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
              onClick={() => setShowLookupHint(open => !open)}
            >
              <InformationCircleIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={event => {
              event.preventDefault();
              void handleAdd();
            }}
          >
            <InputField
              ref={lookupInputRef}
              id="share-collaborator-lookup"
              label={<Translate>Add people or groups</Translate>}
              hideLabel
              value={lookupTerm}
              placeholder={t('System', 'Username, email or group', null, false)}
              autoComplete="off"
              disabled={loading || saving || adding}
              hasErrors={Boolean(lookupError)}
              errorMessage={lookupError || undefined}
              className="min-w-0 flex-1"
              onChange={event => {
                setLookupTerm(event.target.value);
                if (lookupError) setLookupError('');
              }}
            />
            <Button
              type="submit"
              variant="warm"
              size="small"
              disabled={loading || saving || adding || !lookupTerm.trim()}
            >
              <Translate>Add</Translate>
            </Button>
          </form>
          {showLookupHint ? (
            <p id="share-lookup-hint" className="text-[11px] text-ink-tertiary">
              <Translate>
                Enter the full username, email, or group name. Suggestions are not shown.
              </Translate>
            </p>
          ) : null}
        </section>

        <section className="px-5 py-3" data-testid="share-members-list">
          {loading ? (
            <p className="px-1 py-6 text-center text-sm text-ink-muted">
              <Translate>Loading</Translate>…
            </p>
          ) : assignments.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-ink-muted">
              <Translate>No people or groups added yet</Translate>
            </p>
          ) : (
            <div className="divide-y">
              {assignments.map((member, index) => (
                <MemberRow
                  key={memberKey(member)}
                  member={member}
                  showCanSee={!isPublished}
                  onChange={level => updateMember(index, level)}
                  onRemove={() => removeMember(index)}
                />
              ))}
            </div>
          )}
        </section>
      </Modal.Body>

      <Modal.Footer>
        {dirty ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              <Translate>Discard changes</Translate>
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSave()}
              disabled={saving || loading}
            >
              <Translate>Save changes</Translate>
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            <Translate>Close</Translate>
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export type { ShareEntityModalProps };
export { ShareEntityModal };
