import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import {
  applyMetadataFieldFocus,
  FLASH_MS,
  focusMetadataFieldAtom,
} from './focusMetadataFieldAtom.js';
import {
  Date,
  RelationshipCards,
  MetadataCard,
  MetadataItemsTable,
  DocumentPreviewCard,
} from './Components/index.js';
import type { MetadataItem } from './Components/MetadataItemsTable.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import { buildMetadataRecordFields } from './buildMetadataRecordFields.js';
import { isLongField, partitionMetadataRecord } from './metadataPropertyLayout.js';
import { renderFieldContent, renderScalarContent } from './Components/metadataFieldContent.js';
import { fieldTitle, specializedCardTitle } from './Components/metadataFieldTitle.js';
import {
  connectionPillsForField,
  type OpenEntityTarget,
} from './Components/ConnectionPills.js';

type MetadataRecordProps = {
  entity: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

// eslint-disable-next-line max-statements
const MetadataRecord = ({ entity, onOpenEntity }: MetadataRecordProps) => {
  const templates = useAtomValue(templatesAtom);
  const focusField = useAtomValue(focusMetadataFieldAtom);
  const clearFocus = useSetAtom(focusMetadataFieldAtom);
  const rootRef = useRef<HTMLDivElement>(null);
  const prevSharedIdRef = useRef(entity.sharedId);
  const ownsFocusRef = useRef(false);

  useEffect(() => {
    if (prevSharedIdRef.current !== entity.sharedId) {
      ownsFocusRef.current = false;
      clearFocus(null);
      prevSharedIdRef.current = entity.sharedId;
    }
  }, [entity.sharedId, clearFocus]);

  useEffect(
    () => () => {
      if (ownsFocusRef.current) {
        ownsFocusRef.current = false;
        clearFocus(null);
      }
    },
    [clearFocus]
  );

  useLayoutEffect(() => {
    if (!focusField) return undefined;
    let clearTimer: number | undefined;
    const cleanup = applyMetadataFieldFocus(
      () => rootRef.current,
      focusField.fieldKey,
      () => {
        ownsFocusRef.current = true;
        clearTimer = window.setTimeout(() => {
          ownsFocusRef.current = false;
          clearFocus(null);
        }, FLASH_MS);
      }
    );
    return () => {
      cleanup();
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
    };
  }, [focusField, clearFocus]);

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
    const items: MetadataItem[] = [
      {
        id: 'title',
        label: 'Title',
        translationContext,
        content: (
          <span className="font-medium text-ink" no-translate="true">
            {entity.title}
          </span>
        ),
      },
    ];

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
        id: field.name,
        label: field.label,
        translationContext,
        content,
      });
    });

    partition.detailLinkOnlyRels.forEach(field => {
      const content = connectionPillsForField(field, templatePropertyById.get(field._id), {
        showExternalLinkIcon: true,
        onOpenEntity,
      });
      if (!content) {
        return;
      }
      items.push({
        id: field.name,
        label: field.label,
        translationContext,
        content,
      });
    });

    return items;
  }, [
    entity.title,
    entity.creationDate,
    entity.editDate,
    onOpenEntity,
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
    <div ref={rootRef} className="flex flex-col gap-3" data-testid="metadata-record">
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
          <div key={field._id} data-field-key={field.name}>
            <MetadataCard title={specializedCardTitle(field, translationContext)}>
              {content}
            </MetadataCard>
          </div>
        );
      })}

      {partition.leadingLinkOnlyRels.map(field => {
        const content = connectionPillsForField(field, templatePropertyById.get(field._id), {
          onOpenEntity,
        });
        if (!content) {
          return null;
        }
        return (
          <div key={field._id} data-field-key={field.name}>
            <MetadataCard title={fieldTitle(field.label, translationContext, field.hideLabel)}>
              {content}
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
        entity={entity}
        onOpenEntity={onOpenEntity}
        inheritingOnly
      />
    </div>
  );
};

export { MetadataRecord };
