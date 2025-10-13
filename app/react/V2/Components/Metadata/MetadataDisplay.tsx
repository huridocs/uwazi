import React, { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { templatesAtom } from 'V2/atoms';
import { Entity, MetadataProperty } from 'V2/domain';
import { Date } from './Date';
import { Geolocation } from './Geolocation';
import { Relationship } from './Relationship';
import { Media } from './Media';
import { Image } from './Image';
import { Text } from './Text';
import { Title } from './Title';
import { Markdown } from './Markdown';
import { Pill } from '../UI';
import { MetadataCard } from './MetadataCard';

type MetadataDisplayProps = {
  entity: Entity;
  templateId: string;
};

const MetadataDisplay = ({ entity, templateId }: MetadataDisplayProps) => {
  const templates = useAtomValue(templatesAtom);

  const template = useMemo(
    () => templates.find(tpl => tpl._id === templateId),
    [templateId, templates]
  );

  const renderMetadataProperty = useCallback(
    // eslint-disable-next-line max-statements
    (data: MetadataProperty) => {
      if (
        data.type === 'date' ||
        data.type === 'daterange' ||
        data.type === 'multidate' ||
        data.type === 'multidaterange'
      ) {
        return <Date timestamps={data.values} label={data.label} translationContext={templateId} />;
      }

      if (data.type === 'geolocation') {
        return (
          <Geolocation markers={data.values} label={data.label} translationContext={templateId} />
        );
      }

      if (data.type === 'media') {
        return <Media values={data.values} label={data.label} translationContext={templateId} />;
      }

      if (data.type === 'image' || data.type === 'preview') {
        const property = template?.properties?.find(prop => prop.name === data.name);
        return (
          <Image
            values={data.values}
            label={data.label}
            translationContext={templateId}
            imageStyle={property?.style === 'contain' ? 'contain' : 'cover'}
          />
        );
      }

      if (data.type === 'text') {
        return <Text values={data.values} label={data.label} translationContext={templateId} />;
      }

      if (data.type === 'markdown') {
        return <Markdown values={data.values} label={data.label} translationContext={templateId} />;
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
          <Relationship values={data.values} label={data.label} translationContext={templateId} />
        );
      }

      return undefined;
    },
    [template, templateId]
  );

  return (
    <dl className="flex flex-col gap-4">
      <MetadataCard>
        <dt className="sr-only">
          <Translate>Template</Translate>
        </dt>
        <dd>
          <Pill color="primary">
            <Translate className="font-medium" context={templateId}>
              {template?.name}
            </Translate>
          </Pill>
        </dd>
        <Title
          label="Title"
          title={entity.title}
          translationContext={templateId}
          iconId={entity.icon._id}
        />
      </MetadataCard>

      <Date timestamps={[entity.creationDate]} label="Creation date" translationContext="System" />

      <Date timestamps={[entity.editDate]} label="Edit date" translationContext="System" />

      {entity.metadata.map(renderMetadataProperty)}
    </dl>
  );
};

export { MetadataDisplay };
