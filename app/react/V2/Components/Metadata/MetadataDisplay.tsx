import React, { useCallback } from 'react';
import { Translate } from 'app/I18N';
import { Entity, MetadataProperty } from 'V2/domain';
import { Date } from './Date';
import { Geolocation } from './Geolocation';
import { Relationship } from './Relationship';
import { Media } from './Media';
import { Image } from './Image';
import { Text } from './Text';
import { Title } from './Title';
import { Markdown } from './Markdown';
import { Select } from './Select';
import { MetadataCard } from './MetadataCard';
import { TemplateLabel } from './TemplateLabel';

type MetadataDisplayProps = {
  entity: Entity;
};

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templateId = entity?.template?._id!;

  const renderMetadataProperty = useCallback(
    // eslint-disable-next-line max-statements
    (data: MetadataProperty) => {
      const translationContext = templateId;

      if (
        data.type === 'date' ||
        data.type === 'daterange' ||
        data.type === 'multidate' ||
        data.type === 'multidaterange'
      ) {
        return (
          <Date
            timestamps={data.values}
            label={data.label}
            translationContext={translationContext}
          />
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
            // imageStyle={property?.style === 'contain' ? 'contain' : 'cover'}
          />
        );
      }

      if (data.type === 'text') {
        return (
          <Text values={data.values} label={data.label} translationContext={translationContext} />
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

      if (data.type === 'relationship') {
        if (data.inherited === true) {
          const inheritedProperty = data.properties?.inheritedProperty;
          if (!inheritedProperty) return null;
          const reformattedData = {
            values: data.values,
            label: data.label,
            name: data.name,
            type: inheritedProperty.type,
            inherited: data.inherited,
            properties: data.properties,
            translatedLabel: data.translatedLabel,
            propertyMetadata: data.propertyMetadata,
            index: data.index,
          };
          return renderMetadataProperty(reformattedData as MetadataProperty);
        }
        return (
          <Relationship
            values={data.values}
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
    return <div>No entity data available</div>;
  }

  return (
    <dl className="flex flex-col gap-4">
      <MetadataCard>
        <dt className="sr-only">
          <Translate>Template</Translate>
        </dt>
        <TemplateLabel
          label={entity.template?.label || ''}
          color={entity.template?.color}
          templateId={templateId}
        />
        <Title
          label="Title"
          title={entity.title}
          translationContext={templateId}
          iconId={entity.icon?._id}
        />
      </MetadataCard>

      <Date
        timestamps={entity.creationDate.values}
        label={entity.creationDate.label}
        translationContext="System"
      />

      <Date
        timestamps={entity.editDate.values}
        label={entity.editDate.label}
        translationContext="System"
      />

      {entity.metadata.map(renderMetadataProperty)}
    </dl>
  );
};

export { MetadataDisplay };
