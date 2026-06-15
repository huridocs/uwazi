import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipsPanelZoom } from './useRelationshipsPanelZoom.js';

type EvidenceCountButtonProps = {
  count: number;
  expanded: boolean;
  onClick: (event: React.MouseEvent) => void;
};

const EvidenceCountButton = ({ count, expanded, onClick }: EvidenceCountButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={t('System', `${count} evidence references`, null, false)}
    aria-expanded={expanded}
    className="flex h-5 shrink-0 items-center gap-1 rounded bg-warm px-1.5 text-[10px] font-medium tabular-nums text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary"
  >
    <LinkIcon className="h-2.5 w-2.5" />
    {count}
  </button>
);

type CollapsibleRelationshipRowProps = {
  checkboxId: string;
  evidenceCount: number;
  header: ReactNode;
  meta: ReactNode;
  headerWrap?: boolean;
  children: ReactNode;
};

const CollapsibleRelationshipRow = ({
  checkboxId,
  evidenceCount,
  header,
  meta,
  headerWrap = false,
  children,
}: CollapsibleRelationshipRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const { rowPadding, metaHidden } = useRelationshipsPanelZoom();
  const toggle = () => setExpanded(current => !current);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <ListCardRow selected={false} onClick={toggle} className={rowPadding}>
        <div className="flex items-start justify-between gap-2">
          <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
            <RelationshipRowCheckbox relationshipId={checkboxId} />
            <ChevronDownIcon
              className={`h-3 w-3 shrink-0 text-ink-muted transition-transform ${
                expanded ? '' : '-rotate-90'
              }`}
              aria-hidden
            />
            {header}
          </div>
          <EvidenceCountButton
            count={evidenceCount}
            expanded={expanded}
            onClick={event => {
              event.stopPropagation();
              toggle();
            }}
          />
        </div>
        {!metaHidden && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-tertiary">{meta}</div>
        )}
      </ListCardRow>
      {expanded && <div className="border-t border-border/40 bg-warm/30">{children}</div>}
    </div>
  );
};

export { CollapsibleRelationshipRow };
