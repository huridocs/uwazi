import React, { Children, type ReactNode } from 'react';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type {
  RelationshipsPanelView,
  RelationshipsPanelZoom,
} from '#V2/Routes/Entity/Components/context/index.js';
import { DirectionGlyph } from './DirectionGlyph.js';

type Direction = 'incoming' | 'outgoing' | 'both';

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

const hubOverflowHeader = (ctx: HeaderContext) => {
  const pills = Children.toArray(ctx.header).slice(0, 3);
  return (
    <>
      {pills}
      <span className="text-[10px] text-ink-tertiary">+{ctx.memberCount - 3}</span>
    </>
  );
};

const overviewHeader = (ctx: HeaderContext) => {
  if (ctx.hideTargetPill && !ctx.isHub) return fallbackLabel(ctx);
  if (ctx.isHub && ctx.memberCount > 3) return hubOverflowHeader(ctx);
  return resolveHeader(ctx);
};

const compactHeader = (ctx: HeaderContext) => {
  if (ctx.hideTargetPill && !ctx.isHub) return fallbackLabel(ctx);
  if (ctx.isHub && ctx.memberCount > 3) return hubOverflowHeader(ctx);
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

const resolveCollapsibleRowHeader = (ctx: HeaderContext): ReactNode => {
  if (ctx.zoom === 'overview') return overviewHeader(ctx);
  if (ctx.zoom === 'compact') return compactHeader(ctx);
  return detailHeader(ctx);
};

export type { HeaderContext };
export { resolveCollapsibleRowHeader };
