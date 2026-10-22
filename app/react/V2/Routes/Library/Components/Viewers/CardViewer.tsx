import React, { useMemo } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { BlankState, RenderIfVisible } from '#V2/Components/UI/index.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityCard } from '../EntityCard.js';
import { metadataFieldsForCard, thumbnailFromEntity } from '../cardModel.js';
import {
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  PORTRAIT_CARD_GRID_CLASS,
  type ThumbFrame,
  type ThumbSize,
} from '../libraryCardDisplay.js';
import type { LibraryViewerProps } from './types.js';

type CardViewerProps = LibraryViewerProps;

const CARD_EAGER_COUNT = 24;
const CARD_VISIBLE_OFFSET = 600;
const CARD_HEIGHT_WITHOUT_THUMBNAIL = 140;

const CARD_PLACEHOLDER_HEIGHT: Record<ThumbFrame, Record<ThumbSize, number>> = {
  landscape: { s: 212, m: 296, l: 344 },
  portrait: { s: 280, m: 360, l: 480 },
};

const cardPlaceholderHeight = (
  showThumbnail: boolean,
  thumbFrame: ThumbFrame,
  thumbSize: ThumbSize
) =>
  showThumbnail ? CARD_PLACEHOLDER_HEIGHT[thumbFrame][thumbSize] : CARD_HEIGHT_WITHOUT_THUMBNAIL;

const CardViewer = ({
  rows,
  selectedIds = [],
  onSelect,
  entityBasePath,
  showThumbnail,
  showMetadata,
  onFocusProperty,
  thumbFrame = DEFAULT_THUMB_FRAME,
  thumbSize = DEFAULT_THUMB_SIZE,
}: CardViewerProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const templateById = new Map(templates.map(template => [template._id, template]));
  const displayContext = useMemo(() => ({ ...metadataDisplayPresets.compact, locale }), [locale]);

  if (rows.length === 0) {
    return (
      <BlankState
        icon={<FolderIcon className="h-8 w-8 text-ink-muted" />}
        title={<Translate>No entities found</Translate>}
        description={<Translate>Try a different search or clear filters.</Translate>}
      />
    );
  }

  const cardGridCols =
    thumbFrame === 'portrait' && showThumbnail
      ? PORTRAIT_CARD_GRID_CLASS[thumbSize]
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={`grid gap-3 ${cardGridCols}`}>
      {rows.map((entity, index) => {
        const cardEntity = entity as Entity;
        const template = templateById.get(entity.template);
        const thumbnail = thumbnailFromEntity(cardEntity, template, {
          locale,
          defaultLanguage,
        });
        return (
          <RenderIfVisible
            key={entity.sharedId}
            defaultHeight={cardPlaceholderHeight(showThumbnail, thumbFrame, thumbSize)}
            visibleOffset={CARD_VISIBLE_OFFSET}
            initialVisible={index < CARD_EAGER_COUNT}
            rootElementClass="h-full"
          >
            <EntityCard
              title={entity.title}
              icon={cardEntity.icon}
              templateId={entity.template}
              fields={metadataFieldsForCard(cardEntity, template, {
                excludeProperty: showThumbnail ? thumbnail.propertyName : undefined,
                context: displayContext,
              })}
              thumbnailSrc={thumbnail.src}
              thumbnailKind={thumbnail.kind}
              thumbFit={thumbnail.fit}
              thumbFrame={thumbFrame}
              thumbSize={thumbSize}
              showThumbnail={showThumbnail}
              showMetadata={showMetadata}
              selected={selectedIds.includes(entity.sharedId)}
              selectId={entity.sharedId}
              onSelect={modifiers => onSelect(entity.sharedId, modifiers)}
              onFocusProperty={fieldKey => onFocusProperty?.(entity.sharedId, fieldKey)}
              viewHref={`${entityBasePath}/${entity.sharedId}`}
            />
          </RenderIfVisible>
        );
      })}
    </div>
  );
};

export type { CardViewerProps };
export { CardViewer };
