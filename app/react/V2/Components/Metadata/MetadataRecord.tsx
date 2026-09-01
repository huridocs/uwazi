import React, { useMemo, useRef, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { MetadataCard } from './Components/index.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import { buildMetadataRecordFields } from './buildMetadataRecordFields.js';
import {
  inheritGroupKey,
  isInheritingRelationship,
  isLongField,
  isRelationshipProperty,
  metadataGridClassForProperty,
  packPropertyRows,
  partitionMetadataRecord,
} from './metadataPropertyLayout.js';
import { useElementWidth } from './useElementWidth.js';
import { renderFieldContent, renderScalarContent } from './Components/metadataFieldContent.js';
import { fieldTitle, specializedCardTitle } from './Components/metadataFieldTitle.js';
import { connectionPillsForField, type OpenEntityTarget } from './Components/ConnectionPills.js';
import { buildRelationshipCardNodes } from './Components/RelationshipCards.js';
import { useMetadataRecordFocus } from './useMetadataRecordFocus.js';
import { SystemDatesLine } from './Components/SystemDatesLine.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';

type MetadataRecordProps = {
  entity: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const relationshipCardContent = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined,
  onOpenEntity?: (target: OpenEntityTarget) => void
) => connectionPillsForField(field, templateProperty, { onOpenEntity });

const fieldCard = (field: MetadataProperty, layoutClass: string, children: ReactNode) => (
  <div key={field._id} data-field-key={field.name} className={layoutClass}>
    {children}
  </div>
);

type InheritingCardArgs = {
  field: RelationshipMetadataProperty;
  inheritingRels: RelationshipMetadataProperty[];
  templatePropertyById: Map<string, ClientProperty>;
  translationContext: string;
  templates: ClientTemplateSchema[];
  entity: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const inheritingPropertyCard = ({
  field,
  inheritingRels,
  templatePropertyById,
  translationContext,
  templates,
  entity,
  onOpenEntity,
}: InheritingCardArgs) => {
  const groupKey = inheritGroupKey(field, templatePropertyById);
  const [node] = buildRelationshipCardNodes({
    fields: inheritingRels.filter(
      candidate => inheritGroupKey(candidate, templatePropertyById) === groupKey
    ),
    translationContext,
    templatePropertyById,
    templates,
    entity,
    onOpenEntity,
    inheritingOnly: true,
  });
  if (!node) {
    return null;
  }
  return fieldCard(
    field,
    metadataGridClassForProperty(field, templatePropertyById.get(field._id)),
    node
  );
};

const standardPropertyCard = ({
  field,
  translationContext,
  templatePropertyById,
  onOpenEntity,
}: {
  field: MetadataProperty;
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  onOpenEntity?: (target: OpenEntityTarget) => void;
}) => {
  const title = isRelationshipProperty(field)
    ? fieldTitle(field.label, translationContext, field.hideLabel)
    : specializedCardTitle(field, translationContext);
  let content: ReactNode = renderFieldContent(field, { onOpenEntity });
  if (isRelationshipProperty(field)) {
    content = relationshipCardContent(field, templatePropertyById.get(field._id), onOpenEntity);
  } else if (isLongField(field)) {
    content = renderScalarContent(field, true);
  }
  if (!content) {
    return null;
  }
  return fieldCard(
    field,
    metadataGridClassForProperty(field, templatePropertyById.get(field._id)),
    <MetadataCard title={title}>{content}</MetadataCard>
  );
};

// eslint-disable-next-line max-statements
const MetadataRecord = ({ entity, onOpenEntity }: MetadataRecordProps) => {
  const templates = useAtomValue(templatesAtom);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelWidth = useElementWidth(rootRef);
  useMetadataRecordFocus(entity.sharedId, rootRef);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const { relationshipFields, otherFields } = useMemo(
    () => buildMetadataRecordFields(metadata, templatePropertyById, entity),
    [metadata, templatePropertyById, entity]
  );

  const translationContext = entityTemplate?._id || '';

  const partition = useMemo(
    () => partitionMetadataRecord(otherFields, relationshipFields, templatePropertyById),
    [otherFields, relationshipFields, templatePropertyById]
  );

  const masonryRows = useMemo(
    () => packPropertyRows(partition.masonryFields, panelWidth, templatePropertyById),
    [partition.masonryFields, panelWidth, templatePropertyById]
  );

  const hasSystemDates =
    typeof entity.creationDate === 'number' || typeof entity.editDate === 'number';

  const renderPropertyCard = (field: MetadataProperty) =>
    isInheritingRelationship(field)
      ? inheritingPropertyCard({
          field,
          inheritingRels: partition.inheritingRels,
          templatePropertyById,
          translationContext,
          templates,
          entity,
          onOpenEntity,
        })
      : standardPropertyCard({
          field,
          translationContext,
          templatePropertyById,
          onOpenEntity,
        });

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  if (partition.masonryFields.length === 0 && !hasSystemDates) {
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
      {masonryRows.map(row => (
        <div
          key={row.fields.map(field => field._id).join('-')}
          data-property-row={row.fields.map(field => field.name).join(' ')}
          className="flex w-full min-w-0 items-start gap-3"
        >
          {row.fields.map(renderPropertyCard)}
        </div>
      ))}

      {hasSystemDates ? <SystemDatesLine entity={entity} /> : null}
    </div>
  );
};

export { MetadataRecord };
