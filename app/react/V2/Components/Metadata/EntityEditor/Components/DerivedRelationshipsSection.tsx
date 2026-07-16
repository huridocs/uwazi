import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import {
  Date,
  Geolocation,
  LinkProperty,
  Markdown,
  Relationship,
  Select,
  SimpleValue,
} from '#V2/Components/Metadata/Components/index.js';
import { buildTemplatePropertyById } from '#V2/Components/Metadata/buildTemplatePropertyById.js';
import { useFormatMetadata } from '#V2/Components/Metadata/hooks/useFormatMetadata.js';
import { metadataGridClassForProperty } from '#V2/Components/Metadata/metadataPropertyLayout.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import type { FormMetadataProperty } from '../functions/formatMetadataForForm.js';

type DerivedRelationshipsSectionProps = {
  entity: Entity;
  properties: FormMetadataProperty[];
};

const renderField = (
  data: MetadataProperty,
  translationContext: string,
  templatePropertyById: ReturnType<typeof buildTemplatePropertyById>
) => {
  const className = metadataGridClassForProperty(data, templatePropertyById.get(data._id));

  if (data.type === 'relationship') {
    const templateProperty = templatePropertyById.get(data._id);
    return (
      <Relationship
        key={data._id}
        values={data.values}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
        relationTypeId={templateProperty?.relationType}
        targetTemplateId={data.relationShipTarget || templateProperty?.content}
      />
    );
  }

  if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
    return (
      <SimpleValue
        key={data._id}
        values={data.values}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
      />
    );
  }

  if (
    data.type === 'date' ||
    data.type === 'daterange' ||
    data.type === 'multidate' ||
    data.type === 'multidaterange'
  ) {
    return (
      <Date
        key={data._id}
        values={data.values}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
      />
    );
  }

  if (data.type === 'select' || data.type === 'multiselect') {
    return (
      <Select
        key={data._id}
        values={data}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
      />
    );
  }

  if (data.type === 'markdown') {
    return (
      <Markdown
        key={data._id}
        values={data.values}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
      />
    );
  }

  if (data.type === 'link') {
    return (
      <LinkProperty
        key={data._id}
        values={data.values}
        label={data.label}
        translationContext={translationContext}
        hideLabel={data.hideLabel}
        className={className}
      />
    );
  }

  if (data.type === 'geolocation') {
    const isGroup = Boolean(data.propertyGroup?.length);
    return (
      <Geolocation
        key={data._id}
        markers={data.values}
        label={data.label}
        isGroup={isGroup}
        translationContext={translationContext}
        hideLabel={!isGroup && data.hideLabel}
        className={className}
      />
    );
  }

  return null;
};

const DerivedRelationshipsSection = ({ entity, properties }: DerivedRelationshipsSectionProps) => {
  const templates = useAtomValue(templatesAtom);
  const { entityTemplate, metadata } = useFormatMetadata(entity, templates);
  const derivedNames = useMemo(
    () => new Set(properties.map(property => property.name)),
    [properties]
  );

  const fields = useMemo(
    () => metadata.filter(field => derivedNames.has(field.name)),
    [derivedNames, metadata]
  );

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  if (!fields.length) {
    return null;
  }

  const translationContext = entityTemplate?._id ?? '';

  return (
    <>
      <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
        <Translate>Derived relationships · read-only</Translate>
      </h3>
      <dl className="flex min-w-0 flex-col gap-3">
        {fields.map(field => renderField(field, translationContext, templatePropertyById))}
      </dl>
    </>
  );
};

export { DerivedRelationshipsSection };
