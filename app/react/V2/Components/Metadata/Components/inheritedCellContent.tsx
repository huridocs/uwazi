import React, { type ReactNode } from 'react';
import { ConnectionPills, type OpenEntityTarget } from './ConnectionPills.js';
import { isPropertyType } from '../isPropertyType.js';
import { relationshipEntityValuesFromMetadata } from '#V2/formatters/metadata/relationshipEntityValue.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { resolveInheritedRelationship } from '#V2/formatters/metadata/resolvePropertyMetadataValues.js';
import { renderFieldContent } from './metadataFieldContent.js';
import { formatInheritedCellProperty } from '../formatInheritedCellProperty.js';
import { inheritedTypeLayout } from '../inheritedTypeLayout.js';

type InheritedRow = {
  value?: unknown;
  label?: string;
  parent?: MetadataValue['parent'];
  inheritedType?: unknown;
  inheritedValue?: InheritedRow[];
};

const readInheritedRows = (input: unknown): InheritedRow[] => {
  if (!Array.isArray(input)) return [];
  return input.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const label = 'label' in item && typeof item.label === 'string' ? item.label : undefined;
    const inheritedType = 'inheritedType' in item ? item.inheritedType : undefined;
    const parent =
      'parent' in item && item.parent && typeof item.parent === 'object'
        ? {
            value: 'value' in item.parent ? item.parent.value : undefined,
            label:
              'label' in item.parent && typeof item.parent.label === 'string'
                ? item.parent.label
                : undefined,
          }
        : undefined;
    return [
      {
        value: 'value' in item ? item.value : undefined,
        label,
        parent,
        inheritedType,
        inheritedValue:
          'inheritedValue' in item ? readInheritedRows(item.inheritedValue) : undefined,
      },
    ];
  });
};

const toMetadataValues = (rows: InheritedRow[]): MetadataValue[] =>
  rows.map(row => ({
    value: row.value,
    label: row.label,
    parent: row.parent,
    inheritedType:
      typeof row.inheritedType === 'string' && isPropertyType(row.inheritedType)
        ? row.inheritedType
        : undefined,
    inheritedValue: row.inheritedValue?.length ? toMetadataValues(row.inheritedValue) : undefined,
  }));

type InheritedCellContentOptions = {
  onOpenEntity?: (target: OpenEntityTarget) => void;
  inheritTargetTemplateId?: string;
};

const labelFallback = (items: MetadataValue[]): string | undefined => {
  const parts = items
    .map(item => {
      if (typeof item.label === 'string' && item.label.length > 0) return item.label;
      if (typeof item.value === 'string') return item.value;
      if (typeof item.value === 'number') return String(item.value);
      return undefined;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(', ') : undefined;
};

const inheritedCellContent = (
  values: unknown,
  entityId: string,
  options: InheritedCellContentOptions = {}
): ReactNode => {
  const rows = readInheritedRows(values);
  const row = rows.find(value => String(value.value ?? '') === entityId);
  if (!row?.inheritedValue?.length) return undefined;

  const inheritedType =
    typeof row.inheritedType === 'string' && isPropertyType(row.inheritedType)
      ? row.inheritedType
      : undefined;
  const flattened = resolveInheritedRelationship(
    toMetadataValues(row.inheritedValue),
    inheritedType
  );
  if (!flattened.values.length) return undefined;

  if (flattened.inheritedType && flattened.inheritedType !== 'relationship') {
    const field = formatInheritedCellProperty(flattened.inheritedType, flattened.values);
    if (field) {
      const { density } = inheritedTypeLayout(flattened.inheritedType);
      const content =
        density !== undefined ? renderFieldContent(field, { density }) : renderFieldContent(field);
      if (content) return content;
    }
  }

  if (flattened.inheritedType === 'relationship') {
    const pillValues = relationshipEntityValuesFromMetadata(flattened.values, {
      defaultTemplateId: options.inheritTargetTemplateId,
      titleFallback: 'sharedId',
    });
    if (pillValues.length) {
      return (
        <ConnectionPills
          values={pillValues}
          targetTemplateId={options.inheritTargetTemplateId}
          onOpenEntity={options.onOpenEntity}
        />
      );
    }
  }

  return labelFallback(flattened.values);
};

export { inheritedCellContent };
export type { InheritedCellContentOptions };
