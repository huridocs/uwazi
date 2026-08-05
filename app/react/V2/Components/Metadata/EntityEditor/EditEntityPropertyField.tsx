/* eslint-disable max-lines */
import React, { Fragment } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { ClientFile } from '#app/istore.js';
import type { FileType } from '#shared/types/fileType.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { MultiselectListOption } from '../../Forms/index.js';
import {
  TextField,
  SelectField,
  MultiselectField,
  DateField,
  DateRangeField,
  MultidateField,
  MultiDateRangeField,
  LinkField,
  GeolocationField,
  RelationshipField,
  MarkdownField,
  NestedField,
  MediaField,
  PreviewField,
} from './Components/index.js';
import type { EditEntityFormValues } from './functions/buildEditEntityDefaultValues.js';
import { getMetadataFieldPath } from './functions/editEntityErrors.js';
import type { FormMetadataProperty } from './functions/formatMetadataForForm.js';
import type { DisplayProperty } from './functions/relationshipGrouping.js';
import {
  buildInheritColumns,
  DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
  thesaurusToOptions,
  type InheritColumnTemplate,
} from './functions/relationshipFieldHelpers.js';

type EditEntityPropertyFieldProps = {
  property: DisplayProperty;
  disabled: boolean;
  activeTemplateId: string;
  thesauri: ClientThesaurus[];
  templates: InheritColumnTemplate[];
  metadataProperties: FormMetadataProperty[];
  metadata?: EditEntityFormValues['metadata'];
  entityMetadata?: Entity['metadata'];
  entitySharedId: string;
  firstEditableRelationshipId?: string;
  entityAttachments: FileType[];
  pendingAttachments: ClientFile[];
  registerPendingAttachment: (attachment: ClientFile) => void;
  removePendingAttachmentIfUnused: (fileLocalID: string) => void;
  onEditSource?: (entityId: string, label: string, templateId?: string) => void;
  relationshipLookup: (params: {
    search: string;
    template?: string;
    limit?: number;
  }) => Promise<{ value: string; label: string }[]>;
  relationshipLookupSearch: (
    property: DisplayProperty,
    selectedValues: MetadataValue[],
    lookedUpOptions?: MultiselectListOption[],
    includeCachedOptions?: boolean
  ) => Promise<MultiselectListOption[]>;
};

const imageStyleForProperty = (style?: string): 'contain' | 'cover' | 'fill' =>
  style === 'contain' || style === 'cover' ? style : 'fill';

// eslint-disable-next-line max-statements
const EditEntityPropertyField = ({
  property,
  disabled,
  activeTemplateId,
  thesauri,
  templates,
  metadataProperties,
  metadata,
  entityMetadata,
  entitySharedId,
  firstEditableRelationshipId,
  entityAttachments,
  pendingAttachments,
  registerPendingAttachment,
  removePendingAttachmentIfUnused,
  onEditSource,
  relationshipLookup,
  relationshipLookupSearch,
}: EditEntityPropertyFieldProps) => {
  const field = getMetadataFieldPath(property);
  const registerOptions = { required: property.required };
  const context = activeTemplateId;

  if (property.type === 'text' || property.type === 'generatedid' || property.type === 'numeric') {
    return (
      <TextField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
        type={property.type === 'numeric' ? 'number' : 'text'}
      />
    );
  }

  if (property.type === 'select') {
    return (
      <SelectField<EditEntityFormValues>
        context={property.content || 'System'}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
        options={thesaurusToOptions(thesauri, property)}
        hideFilters
      />
    );
  }

  if (property.type === 'multiselect') {
    return (
      <MultiselectField<EditEntityFormValues>
        context={property.content || 'System'}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
        options={thesaurusToOptions(thesauri, property)}
      />
    );
  }

  if (property.type === 'relationship') {
    const fieldName = property.groupedRelationshipNames?.[0] ?? property.name;
    return (
      <>
        {property._id === firstEditableRelationshipId ? (
          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Relationships</Translate>
          </p>
        ) : null}
        <RelationshipField<EditEntityFormValues>
          context={context}
          label={property.label}
          field={`metadata.${fieldName}`}
          registerOptions={registerOptions}
          disabled={disabled}
          targetTemplateId={property.content}
          relationTypeId={property.relationType}
          inheritColumns={buildInheritColumns(
            property,
            metadataProperties,
            templates,
            entityMetadata
          )}
          onEditSource={
            onEditSource
              ? (entityId, label) => onEditSource(entityId, label, property.content)
              : undefined
          }
          lookupSearch={async search => {
            const selectedValues = metadata?.[fieldName] ?? [];
            const lookedUp = await relationshipLookup({
              search,
              template: property.content,
              limit: DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
            });
            const lookedUpOptions = lookedUp.map(option => ({
              label: option.label,
              searchLabel: option.label,
              value: option.value,
            }));
            return relationshipLookupSearch(
              property,
              selectedValues,
              lookedUpOptions.filter(
                option =>
                  !search.trim() ||
                  option.searchLabel.toLowerCase().includes(search.trim().toLowerCase())
              ),
              !search.trim()
            );
          }}
        />
      </>
    );
  }

  if (property.type === 'date') {
    return (
      <DateField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'daterange') {
    return (
      <DateRangeField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'multidate') {
    return (
      <MultidateField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'multidaterange') {
    return (
      <MultiDateRangeField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'link') {
    return (
      <LinkField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'geolocation') {
    return (
      <GeolocationField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'markdown') {
    return (
      <MarkdownField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'nested') {
    return (
      <NestedField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        registerOptions={registerOptions}
        disabled={disabled}
      />
    );
  }

  if (property.type === 'image' || property.type === 'media') {
    return (
      <MediaField<EditEntityFormValues>
        context={context}
        label={property.label}
        field={field}
        mode={property.type}
        imageStyle={property.type === 'image' ? imageStyleForProperty(property.style) : undefined}
        registerOptions={registerOptions}
        disabled={disabled}
        attachments={entityAttachments}
        pendingAttachments={pendingAttachments}
        entitySharedId={entitySharedId}
        onRegisterPendingAttachment={registerPendingAttachment}
        onRemovePendingAttachment={removePendingAttachmentIfUnused}
      />
    );
  }

  if (property.type === 'preview') {
    const previewValue = metadata?.[property.name]?.[0]?.value;
    return (
      <PreviewField
        context={context}
        label={property.label}
        value={typeof previewValue === 'string' ? previewValue : undefined}
      />
    );
  }

  return null;
};

export { EditEntityPropertyField };
export type { EditEntityPropertyFieldProps };
