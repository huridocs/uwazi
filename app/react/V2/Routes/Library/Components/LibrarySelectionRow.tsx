import React, { Fragment, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { Template } from '#app/apiResponseTypes.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { metadataFieldsForCard, thumbnailFromEntity } from './cardModel.js';
import { EntityThumbnail } from './EntityThumbnail.js';
import type { ThumbSize } from './libraryCardDisplay.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';

const LIST_CHIP_CLASS: Record<ThumbSize, string> = {
  s: 'w-7 h-7',
  m: 'w-9 h-9',
  l: 'w-12 h-12',
};

const viewLinkClassName =
  'inline-flex h-6 shrink-0 cursor-pointer items-center rounded-md bg-warm px-2.5 text-meta font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink';

type LibrarySelectionRowProps = {
  hit: LibrarySearchHit;
  entityBasePath: string;
  showThumbnail: boolean;
  showMetadata: boolean;
  thumbSize: ThumbSize;
  onPreview: (sharedId: string) => void;
  onRemove: (sharedId: string) => void;
};

const rowFields = ({
  hit,
  template,
  locale,
  defaultLanguage,
  showThumbnail,
}: {
  hit: LibrarySearchHit;
  template: Template | undefined;
  locale: string;
  defaultLanguage: string | undefined;
  showThumbnail: boolean;
}) => {
  const cardEntity = hit as Entity;
  const thumbnail = thumbnailFromEntity(cardEntity, template, { locale, defaultLanguage });
  const metaFields = metadataFieldsForCard(cardEntity, template, {
    excludeProperty: showThumbnail ? thumbnail.propertyName : undefined,
    context: { ...metadataDisplayPresets.compact, locale },
  }).slice(0, 2);
  return { thumbnail, metaFields };
};

const LibrarySelectionRow = ({
  hit,
  entityBasePath,
  showThumbnail,
  showMetadata,
  thumbSize,
  onPreview,
  onRemove,
}: LibrarySelectionRowProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';
  const settings = useAtomValue(settingsAtom);
  const template = useMemo(
    () => templates.find(item => item._id === hit.template),
    [hit.template, templates]
  );
  const { accentHex } = useTemplatePillColors(template?.color);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const { thumbnail, metaFields } = rowFields({
    hit,
    template,
    locale,
    defaultLanguage,
    showThumbnail,
  });

  return (
    <li
      data-component="EntityCard"
      className="group relative w-full cursor-pointer rounded-md border border-border/60 bg-paper text-start transition-colors hover:bg-parchment"
    >
      <button
        type="button"
        aria-label={`Preview ${hit.title}`}
        onClick={() => onPreview(hit.sharedId)}
        className="absolute inset-0 w-full cursor-pointer rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
      />
      <div className="pointer-events-none relative flex items-center gap-3 px-3 py-2">
        {showThumbnail ? (
          <EntityThumbnail
            src={thumbnail.src}
            kind={thumbnail.kind}
            fit={thumbnail.fit}
            frame="landscape"
            tint={accentHex}
            alt=""
            className={`${LIST_CHIP_CLASS[thumbSize]} shrink-0 overflow-hidden rounded`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-snug text-ink">{hit.title}</div>
          <div className="flex min-w-0 items-center gap-1.5 text-meta text-ink-tertiary">
            {!showThumbnail ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: accentHex }}
              />
            ) : null}
            <span className="shrink-0">{template?.name ?? hit.template}</span>
            {showMetadata
              ? metaFields.map(field => (
                  <Fragment key={field.id}>
                    <span className="shrink-0 text-ink-muted">·</span>
                    <span className="truncate">{field.value}</span>
                  </Fragment>
                ))
              : null}
          </div>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <I18NLink to={`${entityBasePath}/${hit.sharedId}`} className={viewLinkClassName}>
            <Translate>View</Translate>
          </I18NLink>
          <span className="flex h-6 w-6 shrink-0">
            <button
              type="button"
              data-part="remove"
              aria-label={`Remove ${hit.title} from selection`}
              title="Remove from selection"
              onClick={event => {
                event.stopPropagation();
                onRemove(hit.sharedId);
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-warm hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-carbon/30 focus-visible:outline-none group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <LibrarySelectionIcon name="x" size={13} />
            </button>
          </span>
        </div>
      </div>
    </li>
  );
};

export type { LibrarySelectionRowProps };
export { LibrarySelectionRow };
