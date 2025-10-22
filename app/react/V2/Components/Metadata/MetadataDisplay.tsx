import React, { useCallback } from 'react';
import { Translate } from 'app/I18N';
import { Entity, MetadataProperty } from 'V2/domain';
import { Date } from './Date';
import { Geolocation } from './Geolocation';
import { Relationship } from './Relationship';
import { Media } from './Media';
import { Image } from './Image';
import { SimpleValue } from './SimpleValue';
import { Title } from './Title';
import { Markdown } from './Markdown';
import { Select } from './Select';
import { MetadataCard } from './MetadataCard';
import { TemplateLabel } from './TemplateLabel';
import { LinkProperty } from './LinkProperty';

type MetadataDisplayProps = {
  entity: Entity;
};

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templateId = entity?.template?._id!;

  const renderMetadataProperty = useCallback(
    // eslint-disable-next-line max-statements
    (data: MetadataProperty) => {
      const translationContext = templateId;

      if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
        return (
          <SimpleValue
            values={data.values}
            label={data.label}
            translationContext={translationContext}
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
          <Date values={data.values} label={data.label} translationContext={translationContext} />
        );
      }

      if (data.type === 'geolocation') {
        return (
          <Geolocation
            markers={data.values}
            label={data.label}
            translationContext={translationContext}
          />
        );
      }

      if (data.type === 'media') {
        return (
          <Media values={data.values} label={data.label} translationContext={translationContext} />
        );
      }

      if (data.type === 'image' || data.type === 'preview') {
        return (
          <Image
            values={data.values}
            label={data.label}
            translationContext={translationContext}
            imageStyle={data.properties?.style === 'contain' ? 'contain' : 'cover'}
          />
        );
      }

      if (data.type === 'markdown') {
        return (
          <Markdown
            values={data.values}
            label={data.label}
            translationContext={translationContext}
          />
        );
      }

      if (data.type === 'select' || data.type === 'multiselect') {
        return (
          <Select values={data.values} label={data.label} translationContext={translationContext} />
        );
      }

      if (data.type === 'link') {
        return (
          <LinkProperty
            values={data.values}
            label={data.label}
            translationContext={translationContext}
            hideLabel={data.properties?.hideLabel}
          />
        );
      }

      if (data.type === 'relationship') {
        if (data.properties?.inherited && data.properties.inheritedProperty) {
          const inheritedType = data.properties.inheritedProperty.type;
          const { properties, ...restData } = data;
          const reformattedData = {
            ...restData,
            ...properties.inheritedProperty,
            name: data.name,
            label: data.label,
            transtalatedLabel: data.translatedLabel,
            type: inheritedType,
          };
          return renderMetadataProperty(reformattedData as MetadataProperty);
        }
        return (
          <Relationship
            values={Array.isArray(data.values) ? data.values : []}
            label={data.label}
            translationContext={translationContext}
          />
        );
      }

      return undefined;
    },
    [templateId]
  );

  if (!entity) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  return (
    <dl className="flex flex-col gap-4">
      <MetadataCard>
        <dt className="sr-only">
          <Translate>Template</Translate>
        </dt>
        <dd>
          <TemplateLabel
            label={entity.template?.label || ''}
            color={entity.template?.color}
            templateId={templateId}
          />
        </dd>
        <Title
          label="Title"
          title={entity.title}
          translationContext={templateId}
          iconId={entity.icon?._id}
        />
      </MetadataCard>

      {entity.creationDate && (
        <Date
          values={entity.creationDate.values}
          label="Creation Date"
          translationContext="System"
        />
      )}

      {entity.editDate && (
        <Date values={entity.editDate.values} label="Edit Date" translationContext="System" />
      )}

      {entity.metadata.map(renderMetadataProperty)}
    </dl>
  );
};

export { MetadataDisplay };
