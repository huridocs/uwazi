import React from 'react';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { EntityThumbnail, type ThumbnailKind } from './EntityThumbnail.js';

type EntityCardField = {
  id: string;
  label: string;
  value: string;
};

type EntityCardLayout = 'cards' | 'list';

type EntityCardProps = {
  title: string;
  templateId: string;
  fields?: EntityCardField[];
  thumbnailSrc?: string;
  thumbnailKind?: ThumbnailKind;
  layout: EntityCardLayout;
  selected?: boolean;
  onSelect?: () => void;
  viewHref: string;
};

const EntityCard = ({
  title,
  templateId,
  fields = [],
  thumbnailSrc,
  thumbnailKind,
  layout,
  selected = false,
  onSelect,
  viewHref,
}: EntityCardProps) => {
  const viewButton = (
    <I18NLink
      to={viewHref}
      onClick={event => event.stopPropagation()}
      className="inline-flex h-6 shrink-0 items-center rounded-md bg-warm px-2.5 text-[11px] font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
    >
      <Translate>View</Translate>
    </I18NLink>
  );

  const base =
    'group text-start rounded-md border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30';
  const surface = selected
    ? 'bg-parchment border-border'
    : 'bg-paper border-border/60 hover:bg-parchment';

  const activate = () => onSelect?.();

  if (layout === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={activate}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        }}
        className={`${base} ${surface} flex w-full items-center gap-3 px-3 py-2.5`}
      >
        {(thumbnailSrc || thumbnailKind) && (
          <EntityThumbnail
            src={thumbnailSrc}
            kind={thumbnailKind}
            alt=""
            className="h-9 w-9 shrink-0 overflow-hidden rounded"
          />
        )}
        <TemplatePill templateId={templateId} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{title}</span>
        {fields[0] && (
          <span className="hidden max-w-[14rem] truncate text-[11px] text-ink-tertiary md:block">
            {fields[0].label}: <span className="text-ink-secondary">{fields[0].value}</span>
          </span>
        )}
        {viewButton}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={activate}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
      className={`${base} ${surface} flex h-full flex-col gap-2.5 p-3`}
    >
      {(thumbnailSrc || thumbnailKind) && (
        <EntityThumbnail
          src={thumbnailSrc}
          kind={thumbnailKind}
          alt=""
          className="h-24 w-full shrink-0 overflow-hidden rounded border border-border/60"
        />
      )}
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{title}</span>
      <div className="flex-1 space-y-1.5">
        {fields.map(field => (
          <div key={field.id} className="min-w-0">
            <span className="block text-[10px] leading-tight text-ink-tertiary">{field.label}</span>
            <span className="block line-clamp-1 text-xs leading-snug text-ink">{field.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <TemplatePill templateId={templateId} />
        {viewButton}
      </div>
    </div>
  );
};

export type { EntityCardField, EntityCardLayout, EntityCardProps };
export { EntityCard };
