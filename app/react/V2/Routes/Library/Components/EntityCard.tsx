import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';
import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  type ThumbFit,
  type ThumbFrame,
  type ThumbnailKind,
} from './libraryCardDisplay.js';
import { EntityThumbnail } from './EntityThumbnail.js';

type EntityCardField = {
  id: string;
  label: string;
  value: string;
  interactive?: boolean;
};

type EntityCardProps = {
  title: string;
  templateId: string;
  fields?: EntityCardField[];
  thumbnailSrc?: string;
  thumbnailKind?: ThumbnailKind;
  thumbFit?: ThumbFit;
  thumbFrame?: ThumbFrame;
  selected?: boolean;
  onSelect?: () => void;
  onFocusProperty?: (fieldKey: string) => void;
  viewHref: string;
  showThumbnail?: boolean;
  showMetadata?: boolean;
};

const EntityCard = ({
  title,
  templateId,
  fields = [],
  thumbnailSrc,
  thumbnailKind,
  thumbFit = DEFAULT_THUMB_FIT,
  thumbFrame = DEFAULT_THUMB_FRAME,
  selected = false,
  onSelect,
  onFocusProperty,
  viewHref,
  showThumbnail = true,
  showMetadata = true,
}: EntityCardProps) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );
  const { accentHex } = useTemplatePillColors(template?.color);

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
      {showThumbnail && (
        <EntityThumbnail
          src={thumbnailSrc}
          kind={thumbnailKind}
          fit={thumbFit}
          frame={thumbFrame}
          tint={accentHex}
          alt=""
          className={`${
            thumbFrame === 'portrait' ? 'aspect-[3/4]' : 'h-[142px]'
          } w-full shrink-0 overflow-hidden rounded border border-border/60`}
        />
      )}
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{title}</span>
      {showMetadata && (
        <div className="flex-1 space-y-1.5">
          {fields.map(field => (
            <div key={field.id} className="min-w-0">
              <span className="block text-[10px] leading-tight text-ink-tertiary">
                {field.label}
              </span>
              {field.interactive ? (
                <button
                  type="button"
                  title={field.value}
                  className="block w-full truncate text-start text-xs leading-snug text-ink underline-offset-2 hover:underline"
                  onClick={event => {
                    event.stopPropagation();
                    onFocusProperty?.(field.id);
                  }}
                >
                  {field.value}
                </button>
              ) : (
                <span className="block truncate text-xs leading-snug text-ink" title={field.value}>
                  {field.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-1">
        <TemplateLabel templateId={templateId} variant="tag" />
        {viewButton}
      </div>
    </div>
  );
};

export type { EntityCardField, EntityCardProps };
export { EntityCard };
