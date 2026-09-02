import React, { useMemo, useRef, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { MetadataCard, DocumentPreviewCard } from './Components/index.js';
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
import { useContainerWidth } from '#V2/Components/PDFViewer/hooks/useContainerWidth.js';
import { renderFieldContent, renderScalarContent } from './Components/metadataFieldContent.js';
import { fieldTitle, specializedCardTitle } from './Components/metadataFieldTitle.js';
import { connectionPillsForField, type OpenEntityTarget } from './Components/ConnectionPills.js';
import { buildInheritingCardsByGroupKey } from './Components/RelationshipCards.js';
import { useMetadataRecordFocus } from './useMetadataRecordFocus.js';
import { SystemDatesLine, entityHasSystemDates } from './Components/SystemDatesLine.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';

type MetadataRecordProps = {
  entity: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  showDocumentPreview?: boolean;
};

const fieldCard = (field: MetadataProperty, layoutClass: string, children: ReactNode) => (
  <div key={field._id} data-field-key={field.name} className={layoutClass}>
    {children}
  </div>
);

type InheritingCardArgs = {
  field: RelationshipMetadataProperty;
  inheritingCardsByGroupKey: Map<string, ReactNode>;
  templatePropertyById: Map<string, ClientProperty>;
};

const inheritingPropertyCard = ({
  field,
  inheritingCardsByGroupKey,
  templatePropertyById,
}: InheritingCardArgs) => {
  const node = inheritingCardsByGroupKey.get(inheritGroupKey(field, templatePropertyById));
  if (!node) {
    return null;
  }
  return fieldCard(field, metadataGridClassForProperty(field), node);
};

const standardPropertyCard = ({
  field,
  translationContext,
  templatePropertyById,
  onOpenEntity,
  entity,
  showDocumentPreview,
}: {
  field: MetadataProperty;
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  entity: Entity;
  showDocumentPreview: boolean;
}) => {
  if (showDocumentPreview && field.type === 'preview') {
    return fieldCard(
      field,
      metadataGridClassForProperty(field),
      <DocumentPreviewCard
        entity={entity}
        previewField={field}
        translationContext={translationContext}
      />
    );
  }
  const title = isRelationshipProperty(field)
    ? fieldTitle(field.label, translationContext, field.hideLabel)
    : specializedCardTitle(field, translationContext);
  let content: ReactNode = renderFieldContent(field, { onOpenEntity });
  if (isRelationshipProperty(field)) {
    content = connectionPillsForField(field, templatePropertyById.get(field._id), { onOpenEntity });
  } else if (isLongField(field)) {
    content = renderScalarContent(field, true);
  }
  if (!content) {
    return null;
  }
  return fieldCard(
    field,
    metadataGridClassForProperty(field),
    <MetadataCard title={title}>{content}</MetadataCard>
  );
};

// eslint-disable-next-line max-statements
const MetadataRecord = ({
  entity,
  onOpenEntity,
  showDocumentPreview = false,
}: MetadataRecordProps) => {
  const templates = useAtomValue(templatesAtom);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelWidth = useContainerWidth(rootRef, {
    borderWidth: 0,
    safetyBuffer: 0,
    debounce: 50,
  });
  useMetadataRecordFocus(entity.sharedId, rootRef, panelWidth !== undefined);

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

  const masonryFields = useMemo(
    () =>
      showDocumentPreview
        ? partition.masonryFields
        : partition.masonryFields.filter(field => field.type !== 'preview'),
    [partition.masonryFields, showDocumentPreview]
  );

  const masonryRows = useMemo(
    () => (panelWidth === undefined ? [] : packPropertyRows(masonryFields, panelWidth)),
    [masonryFields, panelWidth]
  );

  const inheritingCardsByGroupKey = useMemo(
    () =>
      buildInheritingCardsByGroupKey({
        fields: partition.inheritingRels,
        translationContext,
        templatePropertyById,
        templates,
        entity,
        onOpenEntity,
        inheritingOnly: true,
      }),
    [
      partition.inheritingRels,
      translationContext,
      templatePropertyById,
      templates,
      entity,
      onOpenEntity,
    ]
  );

  const hasSystemDates = entityHasSystemDates(entity);

  const renderPropertyCard = (field: MetadataProperty) =>
    isInheritingRelationship(field)
      ? inheritingPropertyCard({
          field,
          inheritingCardsByGroupKey,
          templatePropertyById,
        })
      : standardPropertyCard({
          field,
          translationContext,
          templatePropertyById,
          onOpenEntity,
          entity,
          showDocumentPreview,
        });

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  if (masonryFields.length === 0 && !hasSystemDates) {
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
          className="flex w-full min-w-0 items-stretch gap-3"
        >
          {row.fields.map(renderPropertyCard)}
        </div>
      ))}

      {hasSystemDates ? <SystemDatesLine entity={entity} /> : null}
    </div>
  );
};

export { MetadataRecord };
