/* eslint-disable max-lines */
import React, { Fragment, useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { Button } from '#V2/Components/UI/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import {
  Date,
  SimpleValue,
  Title,
  MetadataCard,
  TemplateLabel,
  Select,
  Geolocation,
} from './Components/index.js';
import {
  formatDateProperty,
  formatSimpleProperty,
  formatMetadataFields,
  formatGeolocationProperty,
} from './Formatters/index.js';
import { BaseMetadataProperty } from './MetadataPropertiesType.js';
import { formatSelectProperty } from './Formatters/formatSelectProperty.js';

type MetadataDisplayProps = {
  entity: Entity;
};

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templates = useAtomValue(templatesAtom);
  const entityTemplate = useMemo(
    () => templates.find(template => template._id === entity.template),
    [entity.template, templates]
  );

  const metadataProperties = useMemo(() => formatMetadataFields(entityTemplate), [entityTemplate]);
  const renderMetadataProperty = useCallback(
    // eslint-disable-next-line max-statements
    (property: BaseMetadataProperty) => {
      const translationContext = entityTemplate?._id;

      if (
        property.type === 'text' ||
        property.type === 'generatedid' ||
        property.type === 'numeric'
      ) {
        const simpleProperty = formatSimpleProperty(property, entity.metadata);

        if (!simpleProperty) {
          return undefined;
        }

        return (
          <SimpleValue
            values={simpleProperty.values}
            label={simpleProperty.label}
            translationContext={translationContext || ''}
          />
        );
      }

      if (
        property.type === 'date' ||
        property.type === 'daterange' ||
        property.type === 'multidate' ||
        property.type === 'multidaterange'
      ) {
        const dateProperty = formatDateProperty(property, entity.metadata);

        if (!dateProperty) {
          return undefined;
        }

        return (
          <Date
            values={dateProperty.values}
            label={dateProperty.label}
            translationContext={translationContext || ''}
          />
        );
      }

      if (property.type === 'geolocation') {
        const geolocationProperty = formatGeolocationProperty(property, entity.metadata);

        if (!geolocationProperty) {
          return undefined;
        }

        return (
          <Geolocation
            markers={geolocationProperty.values}
            label={geolocationProperty.label}
            translationContext={translationContext || ''}
          />
        );
      }

      // if (data.type === 'media') {
      //   return (
      //     <Media values={data.values} label={data.label} translationContext={translationContext} />
      //   );
      // }

      // if (data.type === 'image' || data.type === 'preview') {
      //   return (
      //     <Image
      //       values={data.values}
      //       label={data.label}
      //       translationContext={translationContext}
      //       imageStyle={data.properties?.style === 'contain' ? 'contain' : 'cover'}
      //     />
      //   );
      // }

      // if (data.type === 'markdown') {
      //   return (
      //     <Markdown
      //       values={data.values}
      //       label={data.label}
      //       translationContext={translationContext}
      //     />
      //   );
      // }

      if (property.type === 'select' || property.type === 'multiselect') {
        const selectProperty = formatSelectProperty(property, entity.metadata);

        if (!selectProperty) {
          return undefined;
        }

        return (
          <Select
            values={selectProperty}
            label={property.label}
            translationContext={translationContext || ''}
          />
        );
      }

      // if (data.type === 'link') {
      //   return (
      //     <LinkProperty
      //       values={data.values}
      //       label={data.label}
      //       translationContext={translationContext}
      //       hideLabel={data.properties?.hideLabel}
      //     />
      //   );
      // }

      // if (data.type === 'relationship') {
      //   if (data.properties?.inherited && data.properties.inheritedProperty) {
      //     const inheritedType = data.properties.inheritedProperty.type;
      //     const { properties, ...restData } = data;
      //     const reformattedData = {
      //       ...restData,
      //       ...properties.inheritedProperty,
      //       name: data.name,
      //       label: data.label,
      //       transtalatedLabel: data.translatedLabel,
      //       type: inheritedType,
      //     };
      //     return renderMetadataProperty(reformattedData as MetadataProperty);
      //   }
      //   return (
      //     <Relationship
      //       values={Array.isArray(data.values) ? data.values : []}
      //       label={data.label}
      //       translationContext={translationContext}
      //     />
      //   );
      // }

      return undefined;
    },
    [entity.metadata, entityTemplate?._id]
  );

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  return (
    <Panel>
      <Panel.Body>
        <dl className="flex flex-col gap-4">
          <MetadataCard className="bg-gray-50">
            <dt className="sr-only">
              <Translate>Template</Translate>
            </dt>
            <dd>
              <TemplateLabel templateId={entity.template} />
            </dd>
            <Title
              label="Title"
              title={entity.title}
              iconId={entity.icon?._id}
              translationContext={entityTemplate._id || ''}
            />
          </MetadataCard>

          {typeof entity.creationDate === 'number' && (
            <Date
              values={[
                {
                  value: entity.creationDate,
                },
              ]}
              label="Creation Date"
              translationContext="System"
            />
          )}

          {typeof entity.editDate === 'number' && (
            <Date
              values={[
                {
                  value: entity.editDate,
                },
              ]}
              label="Edit Date"
              translationContext="System"
            />
          )}

          {metadataProperties.map((data, index) => (
            <Fragment key={data?.name || data?.label || index}>
              {renderMetadataProperty(data)}
            </Fragment>
          ))}
        </dl>
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex gap-2">
            <Button styling="outline">
              <Translate>Edit</Translate>
            </Button>
            <Button styling="outline">
              <Translate>Share</Translate>
            </Button>
          </div>
          <Button styling="solid" color="error">
            <Translate>Delete</Translate>
          </Button>
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { MetadataDisplay };
