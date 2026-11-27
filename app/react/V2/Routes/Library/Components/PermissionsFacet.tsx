import React from 'react';
import { UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import type {
  LibraryPermissionBucket,
  LibraryPermissionLevel,
  LibraryPermissionPick,
} from '#shared/types/librarySearch.js';
import { AndOrToggle } from './AndOrToggle.js';
import { FacetCard, FacetRow, type FacetMode } from './FacetCard.js';

type PermissionsFacetProps = {
  read: LibraryPermissionBucket[];
  write: LibraryPermissionBucket[];
  selected: LibraryPermissionPick[];
  mode: FacetMode;
  onToggle: (level: LibraryPermissionLevel, refId: string) => void;
  onModeChange: (mode: FacetMode) => void;
  onClear: () => void;
};

const LEVELS: { level: LibraryPermissionLevel; title: string }[] = [
  { level: 'read', title: 'Can view' },
  { level: 'write', title: 'Can edit' },
];

const memberIcon = (group: boolean) =>
  group ? (
    <UsersIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />
  ) : (
    <UserIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />
  );

const rowsFor = (
  level: LibraryPermissionLevel,
  buckets: LibraryPermissionBucket[],
  selected: LibraryPermissionPick[]
) => {
  const picked = new Set(selected.filter(pick => pick.level === level).map(pick => pick.refId));
  const rows = buckets.filter(bucket => bucket.count > 0 || picked.has(bucket.id));
  picked.forEach(refId => {
    if (!rows.some(row => row.id === refId)) {
      rows.push({ id: refId, count: 0, group: false });
    }
  });
  return [...rows].sort(
    (a, b) => b.count - a.count || (a.label ?? a.id).localeCompare(b.label ?? b.id)
  );
};

const PermissionsFacet = ({
  read,
  write,
  selected,
  mode,
  onToggle,
  onModeChange,
  onClear,
}: PermissionsFacetProps) => {
  const buckets = { read, write };

  return (
    <section aria-label={t('System', 'Permissions', null, false)}>
      <FacetCard
        title={<Translate>Permissions</Translate>}
        headerAction={<AndOrToggle value={mode} onChange={onModeChange} />}
        stacked
      >
        {LEVELS.map(({ level, title }) => {
          const rows = rowsFor(level, buckets[level], selected);
          return (
            <div key={level} role="group" aria-label={t('System', title, null, false)}>
              <p className="px-2 pt-1 pb-0.5 text-meta font-semibold uppercase tracking-wider text-ink-tertiary">
                <Translate>{title}</Translate>
              </p>
              {rows.length === 0 ? (
                <p className="px-2 py-1 text-xs text-ink-tertiary">
                  <Translate>No options found</Translate>
                </p>
              ) : (
                rows.map(row => (
                  <FacetRow
                    key={row.id}
                    checked={selected.some(pick => pick.level === level && pick.refId === row.id)}
                    onToggle={() => onToggle(level, row.id)}
                    label={row.label || row.id}
                    count={row.count}
                    icon={memberIcon(row.group)}
                  />
                ))
              )}
            </div>
          );
        })}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer px-2 py-1 text-xs font-medium text-ink-tertiary hover:text-ink"
          >
            <Translate>Clear</Translate>
          </button>
        )}
      </FacetCard>
    </section>
  );
};

export type { PermissionsFacetProps };
export { PermissionsFacet };
