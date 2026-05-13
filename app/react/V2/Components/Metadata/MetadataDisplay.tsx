import React, { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { Button } from '#V2/Components/UI/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import {
  Date,
  SimpleValue,
  Select,
  Geolocation,
  Relationship,
  Markdown,
  LinkProperty,
  Image,
  Media,
} from './Components/index.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import { MetadataHeaderStrip } from './MetadataHeaderStrip.js';
import { metadataGridClassForProperty } from './metadataPropertyLayout.js';

type MetadataDisplayProps = {
  entity: Entity;
};

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templates = useAtomValue(templatesAtom);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const renderMetadataFields = useCallback(
    (fields: MetadataProperty[]) => {
      const translationContext = entityTemplate?._id || '';

      return fields.map(data => {
        if (data.type === 'relationship') {
          return (
            <Relationship
              key={data._id}
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
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
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
            />
          );
        }

        if (data.type === 'media') {
          return (
            <Media
              key={data._id}
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
            />
          );
        }

        if (data.type === 'image' || data.type === 'preview') {
          return (
            <Image
              key={data._id}
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              imageStyle={data.style}
              hideLabel={data.hideLabel}
              className={metadataGridClassForProperty(data, templatePropertyById.get(data._id))}
            />
          );
        }

        return undefined;
      });
    },
    [entityTemplate?._id, templatePropertyById]
  );

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  return (
    <Panel>
      <Panel.Body>
        <>
          <MetadataHeaderStrip entity={entity} />

          <dl className="flex min-w-0 flex-wrap gap-(--spacing-theme-3)">
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

            {renderMetadataFields(metadata)}
          </dl>
        </>
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full gap-(--spacing-theme-3)">
          <div className="flex gap-(--spacing-theme-2)">
            <Button variant="secondary">
              <Translate>Edit</Translate>
            </Button>
            <Button variant="secondary">
              <Translate>Share</Translate>
            </Button>
          </div>
          <Button variant="danger">
            <Translate>Delete</Translate>
          </Button>
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { MetadataDisplay };
