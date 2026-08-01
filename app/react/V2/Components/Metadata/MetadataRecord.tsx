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
import { connectionPillsForField } from './Components/ConnectionPills.js';

type MetadataRecordProps = {
  entity: Entity;
};

const FOCUS_RETRY_MS = 50;
const FOCUS_RETRY_MAX = 20;

const MetadataRecord = ({ entity }: MetadataRecordProps) => {
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
    // Jump-while-unmounted keeps the atom until remount; owner unmount/sharedId clears stale focus.
    let cancelled = false;
    let flashCleanup: (() => void) | null = null;
    let retryTimer: number | undefined;
    let attempts = 0;

    const tryApply = () => {
      if (cancelled) return;
      const root = rootRef.current;
      const applied = root ? applyMetadataFieldFocus(root, focusField.fieldKey) : null;
      if (applied) {
        ownsFocusRef.current = true;
        flashCleanup = applied;
        // Delay clear so Strict Mode remount / tab settle can re-apply while atom is set.
        retryTimer = window.setTimeout(() => {
          if (!cancelled) {
            ownsFocusRef.current = false;
            clearFocus(null);
          }
        }, FLASH_MS);
        return;
      }
      if (attempts >= FOCUS_RETRY_MAX) {
        // Do not clear shared atom — another MetadataRecord may own/apply this focus.
        return;
      }
      attempts += 1;
      retryTimer = window.setTimeout(() => {
        requestAnimationFrame(tryApply);
      }, FOCUS_RETRY_MS);
    };

    tryApply();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      flashCleanup?.();
    };
  }, [focusField, clearFocus]);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const { relationshipFields, otherFields, inheritingTerminalById } = useMemo(
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
        const content = connectionPillsForField(field, templatePropertyById.get(field._id));
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
        inheritingTerminalById={inheritingTerminalById}
        inheritingOnly
      />
    </div>
  );
};

export { MetadataRecord };
