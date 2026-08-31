import React, { useMemo, useRef, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { Date, RelationshipCards, MetadataCard, MetadataItemsTable } from './Components/index.js';
import type { MetadataItem } from './Components/MetadataItemsTable.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import { buildMetadataRecordFields } from './buildMetadataRecordFields.js';
import {
  isLongField,
  isRelationshipProperty,
  metadataGridClassForProperty,
  partitionMetadataRecord,
} from './metadataPropertyLayout.js';
import { renderFieldContent, renderScalarContent } from './Components/metadataFieldContent.js';
import { fieldTitle, specializedCardTitle } from './Components/metadataFieldTitle.js';
import { connectionPillsForField, type OpenEntityTarget } from './Components/ConnectionPills.js';
import { useMetadataRecordFocus } from './useMetadataRecordFocus.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';

type MetadataRecordProps = {
  entity: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const relationshipCardContent = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined,
  onOpenEntity?: (target: OpenEntityTarget) => void
) => connectionPillsForField(field, templateProperty, { onOpenEntity });

const systemDateItems = (entity: Entity): MetadataItem[] => {
  const items: MetadataItem[] = [];
  if (typeof entity.creationDate === 'number') {
    items.push({
      id: 'system-creation-date',
      label: 'Creation Date',
      translationContext: 'System',
      content: <Date values={[{ value: entity.creationDate }]} />,
    });
  }
  if (typeof entity.editDate === 'number') {
    items.push({
      id: 'system-edit-date',
      label: 'Edit Date',
      translationContext: 'System',
      content: <Date values={[{ value: entity.editDate }]} />,
    });
  }
  return items;
};

// eslint-disable-next-line max-statements
const MetadataRecord = ({ entity, onOpenEntity }: MetadataRecordProps) => {
  const templates = useAtomValue(templatesAtom);
  const rootRef = useRef<HTMLDivElement>(null);
  useMetadataRecordFocus(entity.sharedId, rootRef);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const { relationshipFields, otherFields } = useMemo(
    () => buildMetadataRecordFields(metadata, templatePropertyById, entity, templates),
    [metadata, templatePropertyById, entity, templates]
  );

  const translationContext = entityTemplate?._id || '';

  const partition = useMemo(
    () => partitionMetadataRecord(otherFields, relationshipFields, templatePropertyById),
    [otherFields, relationshipFields, templatePropertyById]
  );

  const detailItems = useMemo(() => systemDateItems(entity), [entity]);

  const renderPropertyCard = (field: MetadataProperty) => {
    let title: ReactNode;
    let content: ReactNode;
    if (isRelationshipProperty(field)) {
      title = fieldTitle(field.label, translationContext, field.hideLabel);
      content = relationshipCardContent(field, templatePropertyById.get(field._id), onOpenEntity);
    } else {
      title = specializedCardTitle(field, translationContext);
      content = isLongField(field) ? renderScalarContent(field, true) : renderFieldContent(field);
    }
    if (!content) {
      return null;
    }
    return (
      <div
        key={field._id}
        data-field-key={field.name}
        className={metadataGridClassForProperty(field, templatePropertyById.get(field._id))}
      >
        <MetadataCard title={title}>{content}</MetadataCard>
      </div>
    );
  };

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  const hasRelCards = partition.inheritingRels.some(field => field.values.length > 0);
  const empty = partition.masonryFields.length === 0 && detailItems.length === 0 && !hasRelCards;

  if (empty) {
    return (
      <div className="flex items-center justify-center py-10 text-center">
        <p className="text-xs text-ink-muted">
          <Translate>No metadata for this entity yet.</Translate>
        </p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-3" data-testid="metadata-record">
      {detailItems.length > 0 && (
        <MetadataCard title={<Translate>Details</Translate>}>
          <MetadataItemsTable items={detailItems} />
        </MetadataCard>
      )}

      {partition.masonryFields.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-3">
          {partition.masonryFields.map(renderPropertyCard)}
        </div>
      )}

      <RelationshipCards
        fields={partition.inheritingRels}
        translationContext={translationContext}
        templatePropertyById={templatePropertyById}
        templates={templates}
        entity={entity}
        onOpenEntity={onOpenEntity}
        inheritingOnly
      />
    </div>
  );
};

export { MetadataRecord };
