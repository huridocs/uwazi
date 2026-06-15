import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { RelationshipAggregate } from '#V2/formatters/relationships/relationshipsPanelDerivation.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { EntityPill } from './EntityPill.js';
import { ListCardRow } from './ListCardRow.js';
import { RelationshipRow } from './RelationshipRow.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';

type RelationshipAggregateRowProps = {
  aggregate: RelationshipAggregate;
  markers: RelationshipMarker[];
  selfSharedId: string;
  activeRelationshipId?: string;
  onClick: (marker: RelationshipMarker) => void;
  onView: (marker: RelationshipMarker) => void;
  onDelete: (marker: RelationshipMarker) => void;
};

const RelationshipAggregateRow = ({
  aggregate,
  markers,
  selfSharedId,
  activeRelationshipId,
  onClick,
  onView,
  onDelete,
}: RelationshipAggregateRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const relationshipTypeName =
    relationshipTypes.find(type => type._id === aggregate.relationType)?.name ??
    aggregate.relationType;
  const glyphDirection =
    aggregate.directions.length > 1 ? 'both' : (aggregate.directions[0] ?? 'outgoing');

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <ListCardRow selected={false} onClick={() => setExpanded(current => !current)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <RelationshipRowCheckbox relationshipId={aggregate.markerIds[0] ?? ''} />
            <ChevronDownIcon
              className={`h-3 w-3 shrink-0 text-ink-muted transition-transform ${
                expanded ? '' : '-rotate-90'
              }`}
              aria-hidden
            />
            <EntityPill templateId={aggregate.targetTemplateId} label={aggregate.targetTitle} />
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setExpanded(current => !current);
            }}
            aria-label={t(
              'System',
              `${aggregate.markerIds.length} evidence references`,
              null,
              false
            )}
            aria-expanded={expanded}
            className="flex h-5 shrink-0 items-center gap-1 rounded bg-warm px-1.5 text-[10px] font-medium tabular-nums text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary"
          >
            <LinkIcon className="h-2.5 w-2.5" />
            {aggregate.markerIds.length}
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-tertiary">
          <DirectionGlyph direction={glyphDirection} />
          {relationshipTypeName && <span className="capitalize">{relationshipTypeName}</span>}
        </div>
      </ListCardRow>
      {expanded && (
        <div className="border-t border-border/40 bg-warm/30">
          {markers.map((marker, index) => (
            <RelationshipRow
              key={marker._id || `aggregate-${index}`}
              marker={marker}
              selfSharedId={selfSharedId}
              isSelected={activeRelationshipId === marker._id}
              onClick={() => onClick(marker)}
              onView={() => onView(marker)}
              onDelete={() => onDelete(marker)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { RelationshipAggregateRow };
