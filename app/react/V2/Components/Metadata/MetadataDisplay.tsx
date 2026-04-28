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
  Relationship,
} from './Components/index.js';
import {
  formatDateProperty,
  formatSimpleProperty,
  formatMetadataFields,
  formatGeolocationProperty,
  formatRelationshipProperty,
} from './Formatters/index.js';
import { BaseMetadataProperty, MetadataProperty } from './MetadataPropertiesType.js';
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

  const metadataFields: BaseMetadataProperty[] = useMemo(
    () => formatMetadataFields(entityTemplate, { groupGeolocationProperties: true }),
    [entityTemplate]
  );

  const metadata = useMemo(
    () =>
      metadataFields
        .flatMap(field => {
          if (field.type === 'relationship') {
            return formatRelationshipProperty(field, entity.metadata);
          }

          if (field.type === 'text' || field.type === 'generatedid' || field.type === 'numeric') {
            return formatSimpleProperty(field, entity.metadata);
          }

          if (
            field.type === 'date' ||
            field.type === 'daterange' ||
            field.type === 'multidate' ||
            field.type === 'multidaterange'
          ) {
            return formatDateProperty(field, entity.metadata);
          }

          if (field.type === 'geolocation') {
            return formatGeolocationProperty(field, entity.metadata);
          }

          if (field.type === 'select' || field.type === 'multiselect') {
            return formatSelectProperty(field, entity.metadata);
          }

          return undefined;
        })
        .filter(f => f) as MetadataProperty[],
    [entity.metadata, metadataFields]
  );

  const renderMetadataFields = useCallback(
    (fields: MetadataProperty[]) => {
      const translationContext = entityTemplate?._id || '';

      return fields.map((data, index) => {
        const key = data?.name || data?.label || index;

        if (data.type === 'relationship') {
          return (
            <Fragment key={key}>
              <Relationship
                values={data.values}
                label={data.label}
                translationContext={translationContext}
              />
            </Fragment>
          );
        }

        if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
          return (
            <Fragment key={key}>
              <SimpleValue
                values={data.values}
                label={data.label}
                translationContext={translationContext}
              />
            </Fragment>
          );
        }

        if (
          data.type === 'date' ||
          data.type === 'daterange' ||
          data.type === 'multidate' ||
          data.type === 'multidaterange'
        ) {
          return (
            <Fragment key={key}>
              <Date
                values={data.values}
                label={data.label}
                translationContext={translationContext}
              />
            </Fragment>
          );
        }

        if (data.type === 'geolocation') {
          return (
            <Fragment key={key}>
              <Geolocation
                markers={data.values}
                label={data.label}
                isGroup={Boolean(data.propertyGroup?.length)}
                translationContext={translationContext}
              />
            </Fragment>
          );
        }

        if (data.type === 'select' || data.type === 'multiselect') {
          return (
            <Fragment key={key}>
              <Select values={data} label={data.label} translationContext={translationContext} />
            </Fragment>
          );
        }

        return <Fragment key={key} />;
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
