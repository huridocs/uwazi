import React, { ReactNode, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { formatRelationshipLinks } from '#V2/formatters/index.js';
import {
  Date,
  RelationshipCards,
  MetadataCard,
  ConnectionPills,
  isEntityRelationshipValue,
  MetadataItemsTable,
  DocumentPreviewCard,
} from './Components/index.js';
import type { MetadataItem } from './Components/MetadataItemsTable.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import {
  isLongField,
  partitionMetadataRecord,
  templatePropertyInherits,
} from './metadataPropertyLayout.js';
import { renderFieldContent, renderScalarContent } from './Components/metadataFieldContent.js';

type MetadataRecordProps = {
  entity: Entity;
};

const isRelationshipProperty = (data: MetadataProperty): data is RelationshipMetadataProperty =>
  data.type === 'relationship';

const fieldTitle = (label: string, translationContext: string, hideLabel?: boolean) => (
  <Translate className={hideLabel ? 'sr-only' : undefined} context={translationContext}>
    {label}
  </Translate>
);

const specializedCardTitle = (data: MetadataProperty, translationContext: string): ReactNode => {
  if (data.type === 'geolocation' && data.propertyGroup?.length) {
    return (
      <Translate className={data.hideLabel ? 'sr-only' : undefined}>
        Grouped geolocation properties
      </Translate>
    );
  }
  return fieldTitle(data.label, translationContext, data.hideLabel);
};

const MetadataRecord = ({ entity }: MetadataRecordProps) => {
  const templates = useAtomValue(templatesAtom);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const { relationshipFields, otherFields } = useMemo(() => {
    const relationships: RelationshipMetadataProperty[] = [];
    const others: MetadataProperty[] = [];
    const inheritingIds = new Set<string>();

    templatePropertyById.forEach((tpl, id) => {
      if (tpl.type === 'relationship' && templatePropertyInherits(tpl)) {
        inheritingIds.add(id);
      }
    });

    inheritingIds.forEach(id => {
      const tpl = templatePropertyById.get(id);
      if (!tpl || typeof tpl._id !== 'string') {
        return;
      }
      const formatted = formatRelationshipLinks(
        {
          _id: tpl._id,
          name: tpl.name,
          label: tpl.label,
          type: 'relationship',
          inherited: true,
          inheritedType: tpl.inherit?.type,
          relationShipTarget: tpl.content || '',
        },
        entity.metadata
      );
      if (formatted) {
        relationships.push(formatted);
      }
    });

    metadata.forEach(field => {
      if (inheritingIds.has(field._id)) {
        return;
      }
      if (isRelationshipProperty(field)) {
        relationships.push(field);
      } else {
        others.push(field);
      }
    });
    return { relationshipFields: relationships, otherFields: others };
  }, [metadata, templatePropertyById, entity.metadata]);

  const translationContext = entityTemplate?._id || '';
  const hasPrimaryDocument = Boolean(entity.documents?.length);

  const partition = useMemo(
    () =>
      partitionMetadataRecord(
        otherFields,
        relationshipFields,
        templatePropertyById,
        hasPrimaryDocument
      ),
    [otherFields, relationshipFields, templatePropertyById, hasPrimaryDocument]
  );

  const detailItems = useMemo(() => {
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

    partition.detailFields.forEach(field => {
      const content = renderScalarContent(field);
      if (!content) {
        return;
      }
      items.push({
        id: field._id,
        label: field.label,
        translationContext,
        content,
      });
    });

    partition.detailLinkOnlyRels.forEach(field => {
      if (!field.values.every(isEntityRelationshipValue) || field.values.length === 0) {
        return;
      }
      const templateProperty = templatePropertyById.get(field._id);
      items.push({
        id: field._id,
        label: field.label,
        translationContext,
        content: (
          <ConnectionPills
            values={field.values}
            targetTemplateId={field.relationShipTarget || templateProperty?.content}
            showExternalLinkIcon
          />
        ),
      });
    });

    return items;
  }, [
    entity.creationDate,
    entity.editDate,
    partition.detailFields,
    partition.detailLinkOnlyRels,
    templatePropertyById,
    translationContext,
  ]);

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  const hasRelCards = partition.inheritingRels.some(field => field.values.length > 0);
  const empty =
    !partition.showDocumentPreview &&
    partition.leadingFields.length === 0 &&
    partition.leadingLinkOnlyRels.length === 0 &&
    detailItems.length === 0 &&
    !hasRelCards;

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
    <div className="flex flex-col gap-3" data-testid="metadata-record">
      {partition.showDocumentPreview ? (
        <DocumentPreviewCard entity={entity} previewField={partition.previewField} />
      ) : null}

      {partition.leadingFields.map(field => {
        const long = isLongField(field);
        const content = long ? renderScalarContent(field, true) : renderFieldContent(field);
        if (!content) {
          return null;
        }
        return (
          <div key={field._id} data-field-key={field._id}>
            <MetadataCard title={specializedCardTitle(field, translationContext)}>
              {content}
            </MetadataCard>
          </div>
        );
      })}

      {partition.leadingLinkOnlyRels.map(field => {
        if (!field.values.every(isEntityRelationshipValue) || field.values.length === 0) {
          return null;
        }
        const templateProperty = templatePropertyById.get(field._id);
        return (
          <div key={field._id} data-field-key={field._id}>
            <MetadataCard title={fieldTitle(field.label, translationContext, field.hideLabel)}>
              <ConnectionPills
                values={field.values}
                targetTemplateId={field.relationShipTarget || templateProperty?.content}
              />
            </MetadataCard>
          </div>
        );
      })}

      {detailItems.length > 0 && (
        <MetadataCard title={<Translate>Details</Translate>}>
          <MetadataItemsTable items={detailItems} />
        </MetadataCard>
      )}

      <RelationshipCards
        fields={partition.inheritingRels}
        translationContext={translationContext}
        templatePropertyById={templatePropertyById}
        templates={templates}
        inheritingOnly
      />
    </div>
  );
};

export { MetadataRecord };
