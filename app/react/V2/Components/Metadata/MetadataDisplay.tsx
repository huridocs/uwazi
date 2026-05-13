/* eslint-disable max-lines */
import React, { useCallback } from 'react';
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
  Relationship,
  Markdown,
  LinkProperty,
  Image,
  Media,
} from './Components/index.js';
import { MetadataProperty } from '#V2/formatters/types.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';

type MetadataDisplayProps = {
  entity: Entity;
};

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templates = useAtomValue(templatesAtom);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const renderMetadataFields = useCallback(
    (fields: MetadataProperty[]) => {
      const translationContext = entityTemplate?._id || '';

      return fields.map(data => {
        if (data.type === 'relationship') {
          return (
            <Relationship
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
          return (
            <SimpleValue
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
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
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'geolocation') {
          const isGroup = Boolean(data.propertyGroup?.length);
          return (
            <Geolocation
              markers={data.values}
              label={data.label}
              isGroup={isGroup}
              translationContext={translationContext}
              hideLabel={!isGroup && data.hideLabel}
            />
          );
        }

        if (data.type === 'select' || data.type === 'multiselect') {
          return (
            <Select
              values={data}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'markdown') {
          return (
            <Markdown
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'link') {
          return (
            <LinkProperty
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'media') {
          return (
            <Media
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
            />
          );
        }

        if (data.type === 'image' || data.type === 'preview') {
          return (
            <Image
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              imageStyle={data.style}
              hideLabel={data.hideLabel}
            />
          );
        }

        return undefined;
      });
    },
    [entityTemplate?._id]
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

          {renderMetadataFields(metadata)}
        </dl>
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex gap-2">
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
