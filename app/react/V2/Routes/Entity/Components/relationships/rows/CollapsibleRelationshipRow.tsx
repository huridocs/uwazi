import React, { Children, useState, type ReactNode } from 'react';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { ListCardRow } from '#V2/Components/UI/ListCardRow.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type {
  RelationshipsPanelView,
  RelationshipsPanelZoom,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipRowCheckbox } from './RelationshipRowCheckbox.js';
import { DirectionGlyph } from './DirectionGlyph.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';

type Direction = 'incoming' | 'outgoing' | 'both';

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
  targetTemplateId?: string;
  entityTitle?: string;
  templateName?: string;
  children: ReactNode;
};

type HeaderContext = {
  hideTargetPill: boolean;
  hideTemplateName: boolean;
  view: RelationshipsPanelView;
  zoom: RelationshipsPanelZoom;
  header: ReactNode;
  targetTemplateId?: string;
  entityTitle?: string;
  templateName?: string;
  glyphDirection?: Direction;
  relationshipTypeName?: string;
  isHub: boolean;
  memberCount: number;
  headerWrap: boolean;
};

const entityTitleClass: Record<RelationshipsPanelZoom, string> = {
  overview: 'text-xs',
  compact: 'text-xs',
  detail: 'text-sm',
};

const resolveAggregateHeader = (ctx: HeaderContext): ReactNode => {
  if (!ctx.entityTitle || !ctx.targetTemplateId) return ctx.header;
  if (ctx.view === 'tree' && ctx.zoom !== 'overview') {
    return (
      <>
        {!ctx.hideTemplateName && (
          <TemplatePill templateId={ctx.targetTemplateId} label={ctx.templateName} />
        )}
        <span
          title={ctx.entityTitle}
          className={`min-w-0 truncate font-medium text-ink ${entityTitleClass[ctx.zoom]}`}
        >
          {ctx.entityTitle}
        </span>
      </>
    );
  }
  return <TemplatePill templateId={ctx.targetTemplateId} label={ctx.entityTitle} />;
};

const resolveHeader = (ctx: HeaderContext): ReactNode => {
  if (ctx.entityTitle && ctx.targetTemplateId) return resolveAggregateHeader(ctx);
  return ctx.header;
};

const fallbackLabel = ({
  glyphDirection,
  relationshipTypeName,
}: Pick<HeaderContext, 'glyphDirection' | 'relationshipTypeName'>) => {
  const relLabel = relationshipTypeName ? (
    <span className="truncate text-[10px] capitalize text-ink-tertiary">
      {relationshipTypeName}
    </span>
  ) : null;

  if (!glyphDirection) return relLabel;

  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs capitalize text-ink-secondary">
      <DirectionGlyph direction={glyphDirection} />
      {relLabel}
    </span>
  );
};

const overviewHeader = (ctx: HeaderContext) => {
  if (ctx.hideTargetPill && !ctx.isHub) return fallbackLabel(ctx);
  if (ctx.isHub && ctx.memberCount > 3) {
    const pills = Children.toArray(ctx.header).slice(0, 3);
    return (
      <>
        {pills}
        <span className="text-[10px] text-ink-tertiary">+{ctx.memberCount - 3}</span>
      </>
    );
  }
  return resolveHeader(ctx);
};

const compactHeader = (ctx: HeaderContext) => {
  if (ctx.hideTargetPill && !ctx.isHub) return fallbackLabel(ctx);
  if (ctx.isHub && ctx.memberCount > 3) {
    const pills = Children.toArray(ctx.header).slice(0, 3);
    return (
      <>
        {pills}
        <span className="text-[10px] text-ink-tertiary">+{ctx.memberCount - 3}</span>
      </>
    );
  }
  const relLabel = ctx.relationshipTypeName ? (
    <span className="truncate text-[10px] capitalize text-ink-tertiary">
      {ctx.relationshipTypeName}
    </span>
  ) : null;
  return (
    <>
      {ctx.glyphDirection && <DirectionGlyph direction={ctx.glyphDirection} />}
      {resolveHeader(ctx)}
      {relLabel}
    </>
  );
};

const detailHeader = (ctx: HeaderContext) => {
  if (ctx.hideTargetPill) return fallbackLabel(ctx);
  return resolveHeader(ctx);
};

const rowPadding: Record<RelationshipsPanelZoom, string> = {
  overview: 'border-b-0! py-1.5!',
  compact: 'py-2!',
  detail: '',
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
  targetTemplateId,
  entityTitle,
  templateName,
  children,
}: CollapsibleRelationshipRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const { view, zoom } = useRelationshipsPanelLayout();
  const { hideTargetPill, hideTemplateName } = useRelationshipRowVisibility();
  const toggle = () => setExpanded(current => !current);
  const headerCtx: HeaderContext = {
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
  };
  let headerContent: ReactNode;
  if (zoom === 'overview') {
    headerContent = overviewHeader(headerCtx);
  } else if (zoom === 'compact') {
    headerContent = compactHeader(headerCtx);
  } else {
    headerContent = detailHeader(headerCtx);
  }
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
      <ListCardRow selected={false} onClick={toggle} className={rowPadding[zoom]}>
        <div className={`flex ${alignItems} justify-between gap-2`}>
          <div className={`flex min-w-0 items-center gap-1.5 ${headerWrap ? 'flex-wrap' : ''}`}>
            <RelationshipRowCheckbox relationshipId={checkboxId} />
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
