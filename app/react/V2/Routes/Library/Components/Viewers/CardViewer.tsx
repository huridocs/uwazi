import React, { useMemo } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityCard } from '../EntityCard.js';
import { metadataFieldsForCard, thumbnailFromEntity } from '../cardModel.js';
import {
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  PORTRAIT_CARD_GRID_CLASS,
} from '../libraryCardDisplay.js';
import { LoadMore } from '../LoadMore.js';
import type { LibraryViewerProps } from './types.js';

type CardViewerProps = LibraryViewerProps;

const CardViewer = ({
  rows,
  totalRows,
  selectedId,
  onSelect,
  entityBasePath,
  onLoadMore,
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
    <>
      <div className={`grid gap-3 ${cardGridCols}`}>
        {rows.map(entity => {
          const cardEntity = entity as Entity;
          const template = templateById.get(entity.template);
          const thumbnail = thumbnailFromEntity(cardEntity, template, {
            locale,
            defaultLanguage,
          });
          return (
            <EntityCard
              key={entity.sharedId}
              title={entity.title}
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
              selected={selectedId === entity.sharedId}
              onSelect={() => onSelect(entity.sharedId)}
              onFocusProperty={fieldKey => onFocusProperty?.(entity.sharedId, fieldKey)}
              viewHref={`${entityBasePath}/${entity.sharedId}`}
            />
          );
        })}
      </div>
      <LoadMore loaded={rows.length} total={totalRows} onLoadMore={onLoadMore} />
    </>
  );
};

export type { CardViewerProps };
export { CardViewer };
