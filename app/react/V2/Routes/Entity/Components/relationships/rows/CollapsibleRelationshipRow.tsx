import React, { Children, useState, type ReactNode } from 'react';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { useRelationshipsPanelZoom } from '../hooks/useRelationshipsPanelZoom.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';

type Direction = 'incoming' | 'outgoing' | 'both';

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
  meta?: ReactNode;
  glyphDirection?: Direction;
  relationshipTypeName?: string;
  headerWrap?: boolean;
  isHub?: boolean;
  memberCount?: number;
  children: ReactNode;
};

const CollapsibleRelationshipRow = ({
  checkboxId,
  evidenceCount,
  header,
  meta,
  glyphDirection,
  relationshipTypeName,
  headerWrap = false,
  isHub = false,
  memberCount = 0,
  children,
}: CollapsibleRelationshipRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const { compact, overview } = useRelationshipsPanelZoom();
  const { hideTargetPill } = useRelationshipRowVisibility();
  const toggle = () => setExpanded(current => !current);

  const chevron = (
    <ChevronDownIcon
      className={`h-3 w-3 shrink-0 text-ink-muted transition-transform ${
        expanded ? '' : '-rotate-90'
      }`}
      aria-hidden
    />
  );

  const evidenceButton = (
    <EvidenceCountButton
      count={evidenceCount}
      expanded={expanded}
      onClick={event => {
        event.stopPropagation();
        toggle();
      }}
    />
  );

  const relLabel = relationshipTypeName ? (
    <span className="truncate text-[10px] capitalize text-ink-tertiary">
      {relationshipTypeName}
    </span>
  ) : null;

  const fallbackLabel = glyphDirection ? (
    <span className="flex min-w-0 items-center gap-1.5 text-xs capitalize text-ink-secondary">
      <DirectionGlyph direction={glyphDirection} />
      {relLabel}
    </span>
  ) : null;

  const renderOverviewHeader = () => {
    if (hideTargetPill) return fallbackLabel;
    if (isHub && memberCount > 3) {
      const pills = Children.toArray(header).slice(0, 3);
      return (
        <>
          {pills}
          <span className="text-[10px] text-ink-tertiary">+{memberCount - 3}</span>
        </>
      );
    }
    return header;
  };

  const renderCompactHeader = () => {
    if (hideTargetPill) return fallbackLabel;
    return (
      <>
        {glyphDirection && <DirectionGlyph direction={glyphDirection} />}
        {header}
        {relLabel}
      </>
    );
  };

  const hubBadge = isHub ? (
    <span className="text-[10px] uppercase tracking-wide text-ink-tertiary">
      <Translate>hub</Translate>
    </span>
  ) : null;

  if (overview) {
    return (
      <div className="border-b border-border/50 last:border-b-0">
        <ListCardRow selected={false} onClick={toggle} className="!border-b-0 !py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex min-w-0 items-center gap-1 ${headerWrap ? 'flex-wrap' : ''}`}>
              <RelationshipRowCheckbox relationshipId={checkboxId} />
              {chevron}
              {renderOverviewHeader()}
            </div>
            {evidenceButton}
          </div>
        </ListCardRow>
        {expanded && <div className="border-t border-border/40 bg-warm/30">{children}</div>}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="border-b border-border/50 last:border-b-0">
        <ListCardRow selected={false} onClick={toggle} className="!py-2">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
              <RelationshipRowCheckbox relationshipId={checkboxId} />
              {chevron}
              {renderCompactHeader()}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {hubBadge}
              {evidenceButton}
            </div>
          </div>
        </ListCardRow>
        {expanded && <div className="border-t border-border/40 bg-warm/30">{children}</div>}
      </div>
    );
  }

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <ListCardRow selected={false} onClick={toggle}>
        <div className="flex items-start justify-between gap-2">
          <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
            <RelationshipRowCheckbox relationshipId={checkboxId} />
            {chevron}
            {hideTargetPill ? fallbackLabel : header}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {hubBadge}
            {evidenceButton}
          </div>
        </div>
        {meta && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-tertiary">{meta}</div>
        )}
      </ListCardRow>
      {expanded && <div className="border-t border-border/40 bg-warm/30">{children}</div>}
    </div>
  );
};

export { CollapsibleRelationshipRow };
