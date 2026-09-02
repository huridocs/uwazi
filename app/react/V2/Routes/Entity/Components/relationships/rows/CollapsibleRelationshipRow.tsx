import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import type { RelationshipsPanelZoom } from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';
import { useExpandCollapseSignals } from '../hooks/useExpandCollapseSignals.js';
import { useEnsureResolvedOnExpand } from '../hooks/useEnsureResolvedOnExpand.js';
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
  targetSharedId?: string;
  entityTitle?: string;
  templateName?: string;
  children: ReactNode;
};

const collapsibleMetaLayout = ({
  zoom,
  meta,
  hideTargetPill,
  isHub,
}: {
  zoom: RelationshipsPanelZoom;
  meta: ReactNode | undefined;
  hideTargetPill: boolean;
  isHub: boolean;
}) => ({
  showMetaBelow: Boolean(meta && zoom === 'detail' && !hideTargetPill),
  alignItems: zoom === 'detail' && meta && !hideTargetPill ? 'items-start' : 'items-center',
  hubBadge: isHub ? (
    <span className="text-nano uppercase tracking-wide text-ink-tertiary">
      <Translate>hub</Translate>
    </span>
  ) : null,
});

const rowPadding: Record<RelationshipsPanelZoom, string> = {
  overview: 'border-b-0! py-1.5!',
  compact: 'py-2!',
  detail: '',
};

const collapsibleChevron = (expanded: boolean, toggle: () => void) => (
  <button
    type="button"
    onClick={toggle}
    aria-expanded={expanded}
    aria-label={t('System', 'Toggle relationship details', null, false)}
    className="flex shrink-0 rounded p-0.5 text-ink-muted hover:bg-warm hover:text-ink"
  >
    <ChevronDownIcon
      className={`h-3 w-3 shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
      aria-hidden
    />
  </button>
);

const evidenceCountButton = (evidenceCount: number, expanded: boolean, toggle: () => void) => (
  <button
    type="button"
    onClick={event => {
      event.stopPropagation();
      toggle();
    }}
    aria-label={t('System', `${evidenceCount} evidence references`, null, false)}
    aria-expanded={expanded}
    className="flex h-5 shrink-0 items-center gap-1 rounded bg-warm px-1.5 text-nano font-medium tabular-nums text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary"
  >
    <LinkIcon className="h-2.5 w-2.5" />
    {evidenceCount}
  </button>
);

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
  targetSharedId,
  entityTitle,
  templateName,
  children,
}: CollapsibleRelationshipRowProps) => {
  const [expanded, setExpanded] = useState(false);
  useExpandCollapseSignals(setExpanded, checkboxIds);
  useEnsureResolvedOnExpand(expanded);
  const { view, zoom } = useRelationshipsPanelLayout();
  const { hideTargetPill, hideTemplateName } = useRelationshipRowVisibility();
  const toggle = () => setExpanded(current => !current);
  const { showMetaBelow, alignItems, hubBadge } = collapsibleMetaLayout({
    zoom,
    meta,
    hideTargetPill,
    isHub,
  });
  const headerContent = resolveCollapsibleRowHeader({
    hideTargetPill,
    hideTemplateName,
    view,
    zoom,
    header,
    targetTemplateId,
    targetSharedId,
    entityTitle,
    templateName,
    glyphDirection,
    relationshipTypeName,
    isHub,
    memberCount,
    headerWrap,
  });
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <ListCardRow selected={false} className={rowPadding[zoom]}>
        <div className={`flex ${alignItems} justify-between gap-2`}>
          <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
            <RelationshipRowCheckbox relationshipIds={checkboxIds} />
            {collapsibleChevron(expanded, toggle)}
            {headerContent}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {zoom !== 'overview' && hubBadge}
            {evidenceCountButton(evidenceCount, expanded, toggle)}
          </div>
        </div>
        {showMetaBelow && (
          <div className="mt-1 flex items-center gap-1 text-nano text-ink-tertiary">{meta}</div>
        )}
      </ListCardRow>
      {expanded && <div className="ml-3.5">{children}</div>}
    </div>
  );
};

export { CollapsibleRelationshipRow };
