import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import type { RelationshipsPanelZoom } from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';
import {
  resolveCollapsibleRowHeader,
  type HeaderContext,
} from './CollapsibleRelationshipRowHeader.js';

type CollapsibleRelationshipRowProps = {
  checkboxIds: string[];
  evidenceCount: number;
  header: ReactNode;
  meta?: ReactNode;
  glyphDirection?: HeaderContext['glyphDirection'];
  relationshipTypeName?: string;
  headerWrap?: boolean;
  isHub?: boolean;
  memberCount?: number;
  targetTemplateId?: string;
  entityTitle?: string;
  templateName?: string;
  onHeaderClick?: () => void;
  children: ReactNode;
};

const rowPadding: Record<RelationshipsPanelZoom, string> = {
  overview: 'border-b-0! py-1.5!',
  compact: 'py-2!',
  detail: '',
};

const CollapsibleRelationshipRow = ({
  checkboxIds,
  evidenceCount,
  header,
  meta,
  glyphDirection,
  relationshipTypeName,
  headerWrap = false,
  isHub = false,
  memberCount = 0,
  targetTemplateId,
  entityTitle,
  templateName,
  onHeaderClick,
  children,
}: CollapsibleRelationshipRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const { view, zoom } = useRelationshipsPanelLayout();
  const { hideTargetPill, hideTemplateName } = useRelationshipRowVisibility();
  const toggle = () => setExpanded(current => !current);
  const handleHeaderClick = () => {
    if (onHeaderClick) {
      onHeaderClick();
      return;
    }
    toggle();
  };
  const headerContent = resolveCollapsibleRowHeader({
    hideTargetPill,
    hideTemplateName,
    view,
    zoom,
    header,
    targetTemplateId,
    entityTitle,
    templateName,
    glyphDirection,
    relationshipTypeName,
    isHub,
    memberCount,
    headerWrap,
  });
  const chevron = (
    <ChevronDownIcon
      className={`h-3 w-3 shrink-0 text-ink-muted transition-transform ${
        expanded ? '' : '-rotate-90'
      }`}
      aria-hidden
    />
  );
  const evidenceButton = (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        toggle();
      }}
      aria-label={t('System', `${evidenceCount} evidence references`, null, false)}
      aria-expanded={expanded}
      className="flex h-5 shrink-0 items-center gap-1 rounded bg-warm px-1.5 text-[10px] font-medium tabular-nums text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary"
    >
      <LinkIcon className="h-2.5 w-2.5" />
      {evidenceCount}
    </button>
  );
  const hubBadge = isHub ? (
    <span className="text-[10px] uppercase tracking-wide text-ink-tertiary">
      <Translate>hub</Translate>
    </span>
  ) : null;
  const showMetaBelow = meta && zoom === 'detail' && !hideTargetPill;
  const alignItems = zoom === 'detail' && meta && !hideTargetPill ? 'items-start' : 'items-center';

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <ListCardRow selected={false} onClick={handleHeaderClick} className={rowPadding[zoom]}>
        <div className={`flex ${alignItems} justify-between gap-2`}>
          <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
            <RelationshipRowCheckbox relationshipIds={checkboxIds} />
            {chevron}
            {headerContent}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {zoom !== 'overview' && hubBadge}
            {evidenceButton}
          </div>
        </div>
        {showMetaBelow && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-tertiary">{meta}</div>
        )}
      </ListCardRow>
      {expanded && <div className="ml-[14px]">{children}</div>}
    </div>
  );
};

export { CollapsibleRelationshipRow };
