import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityCard, type EntityCardLayout } from '../EntityCard.js';
import { metadataFieldsForCard, thumbnailFromEntity } from '../cardModel.js';
import { LoadMore } from '../LoadMore.js';
import type { LibraryViewerProps } from './types.js';

type CardViewerProps = Omit<LibraryViewerProps, 'layout'> & {
  layout?: EntityCardLayout;
};

const CardViewer = ({
  rows,
  totalRows,
  selectedId,
  onSelect,
  entityBasePath,
  onLoadMore,
  showThumbnail,
  showMetadata,
  layout = 'cards',
}: CardViewerProps) => {
  const templates = useAtomValue(templatesAtom);
  const templateById = new Map(templates.map(template => [template._id, template]));

  if (rows.length === 0) {
    return (
      <BlankState
        icon={<FolderIcon className="h-8 w-8 text-ink-muted" />}
        title={<Translate>No entities found</Translate>}
        description={<Translate>Try a different search or clear filters.</Translate>}
      />
    );
  }

  return (
    <>
      <div
        className={
          layout === 'list'
            ? 'flex flex-col gap-1.5'
            : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
        }
      >
        {rows.map(entity => {
          const cardEntity = entity as Entity;
          const thumbnail = thumbnailFromEntity(cardEntity);
          return (
            <EntityCard
              key={entity.sharedId}
              title={entity.title}
              templateId={entity.template}
              fields={metadataFieldsForCard(cardEntity, templateById.get(entity.template))}
              thumbnailSrc={thumbnail.src}
              thumbnailKind={thumbnail.kind}
              layout={layout}
              showThumbnail={showThumbnail}
              showMetadata={showMetadata}
              selected={selectedId === entity.sharedId}
              onSelect={() => onSelect(entity.sharedId)}
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
