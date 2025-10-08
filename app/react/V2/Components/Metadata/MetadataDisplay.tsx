import React, { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { Date } from './Date';
import { Geolocation } from './Geolocation';
import { Relationship } from './Relationship';
import { Media } from './Media';
import { Image } from './Image';
import { Title } from './Title';

type MetadataDisplayProps = {
  entity: unknown;
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
    data => {
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

      if (data.type === 'relationship') {
        if (data.inherited === true) {
          const inheritedProperty = data.properties?.inheritedProperty;
          if (!inheritedProperty) return null;
          const reformattedData = {
            values: data.values,
            label: data.label,
            name: data.name,
            type: inheritedProperty.type,
          };
          return renderMetadataProperty(reformattedData);
        }
        return (
          <Relationship values={data.values} label={data.label} translationContext={templateId} />
        );
      }

      if (data.type === 'media') {
        return <Media values={data.values} label={data.label} translationContext={templateId} />;
      }

      if (data.type === 'image') {
        return <Image values={data.values} label={data.label} translationContext={templateId} />;
      }

      return undefined;
    },
    [templateId]
  );

  return (
    <dl className="flex flex-col gap-4">
      <Title
        title={entity.title}
        label={entity.template.label}
        translationContext={templateId}
        iconId={entity.icon._id}
      />
      <Date timestamps={[entity.creationDate]} label="Creation date" translationContext="System" />
      <Date timestamps={[entity.editDate]} label="Edit date" translationContext="System" />

      <div>{entity.metadata.map(renderMetadataProperty)}</div>
    </dl>
  );
};

export { MetadataDisplay };
