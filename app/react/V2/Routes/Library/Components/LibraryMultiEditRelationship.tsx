import React, { useMemo } from 'react';
import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import type { MetadataValue } from '#V2/formatters/types.js';
import { RelationshipField } from '#V2/Components/Metadata/EntityEditor/Components/index.js';
import {
  defaultRelationshipLookup,
  mergeRelationshipLookupOptions,
  relationshipListOptions,
} from '#V2/Components/Metadata/EntityEditor/functions/relationshipFieldHelpers.js';
import type { DisplayProperty } from '#V2/Components/Metadata/EntityEditor/functions/relationshipGrouping.js';

type LibraryMultiEditRelationshipProps = {
  property: DisplayProperty;
  context: string;
  disabled: boolean;
  field: Path<FieldValues>;
};

const LibraryMultiEditRelationship = ({
  property,
  context,
  disabled,
  field,
}: LibraryMultiEditRelationshipProps) => {
  const { getValues } = useFormContext();
  const cache = useMemo(() => new Map(), []);

  return (
    <RelationshipField
      context={context}
      label={property.label}
      field={field}
      disabled={disabled}
      targetTemplateId={property.content}
      relationTypeId={property.relationType}
      inheritColumns={[]}
      lookupSearch={async (search, offset) => {
        const selectedValues = (getValues(field) as MetadataValue[] | undefined) ?? [];
        const lookedUp = await defaultRelationshipLookup({
          search,
          template: property.content,
          offset,
        });
        return {
          options: mergeRelationshipLookupOptions({
            property,
            selectedValues,
            lookedUpOptions: relationshipListOptions(lookedUp),
            cache,
            includeCachedOptions: !search.trim(),
          }),
          total: lookedUp.total,
          fetched: lookedUp.options.length,
        };
      }}
    />
  );
};

export { LibraryMultiEditRelationship };
