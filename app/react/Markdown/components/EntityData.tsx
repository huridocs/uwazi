/* eslint-disable react/no-multi-comp */
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { ClientTemplateSchema, IStore } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';
import { safeName } from 'shared/propertyNames';
import { showByType } from 'app/Metadata/components/Metadata';
import { Translate } from 'app/I18N';
import { IImmutable } from 'shared/types/Immutable';
import { ensure } from 'shared/tsUtils';

export interface EntityDataProps {
  'value-of'?: string;
  'label-of'?: string;
}

interface Options {
  formattedEntity: any;
  property: string;
  newNameGeneration: boolean;
  template?: IImmutable<ClientTemplateSchema>;
}

const mapStateToProps = ({ entityView, templates, thesauris, settings }: IStore) => ({
  entity: entityView.entity,
  templates,
  thesauri: thesauris,
  settings,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntityDataProps & MappedProps;

const rootProperties = ['title', 'creationDate', 'editDate'];

const getPropertyData = ({ formattedEntity, property, newNameGeneration }: Options) =>
  formattedEntity.metadata.find((p: any) => p.name === safeName(property, newNameGeneration));

const extractRootProperty = ({ formattedEntity, property }: Options) => formattedEntity[property];

const extractMetadataProperty = ({ formattedEntity, property, newNameGeneration }: Options) => {
  const propertyData = formattedEntity.metadata.find(
    (p: any) => p.name === safeName(property, newNameGeneration)
  );
  return showByType(propertyData, false);
};

const extractRootLabel = ({ property, template: _template }: Options) => {
  const template = ensure<IImmutable<ClientTemplateSchema>>(_template);
  const term =
    template
      .get('commonProperties')
      ?.find(p => p?.get('name') === property)
      .get('label') || '';

  const context = property === 'title' ? template.get('_id') : 'System';
  return <Translate context={context}>{term}</Translate>;
};

const extractMetadataLabel = ({ formattedEntity, property, newNameGeneration }: Options) => {
  const propertyData = getPropertyData({ formattedEntity, property, newNameGeneration });
  return <Translate context={propertyData.translateContext}>{propertyData.label}</Translate>;
};

const logError = (err: any, propValueOf?: string, propLabelOf?: string) => {
  /* eslint-disable no-console */
  console.log('Error on EntityData: ');
  console.log('value-of: ', propValueOf, '; label-of: ', propLabelOf);
  console.log(err);
  /* eslint-enable no-console */
};

const getProperty = (
  propValueOf?: EntityDataProps['value-of'],
  propLabelOf?: EntityDataProps['label-of']
) => {
  if (propValueOf && propLabelOf) {
    throw new Error('Can\'t provide both "value-of" and "label-of".');
  }

  const property = propValueOf || propLabelOf;

  if (!property) {
    throw new Error('"value-of" or "label-of" must be provided.');
  }

  return property;
};

const getMethod = (propValueOf: string | undefined, isRootProperty: boolean) => {
  let method: Function = () => {};

  if (propValueOf && isRootProperty) {
    method = extractRootProperty;
  }

  if (propValueOf && !isRootProperty) {
    method = extractMetadataProperty;
  }

  if (!propValueOf && isRootProperty) {
    method = extractRootLabel;
  }

  if (!propValueOf && !isRootProperty) {
    method = extractMetadataLabel;
  }

  return method;
};

const prepareData = (
  propValueOf?: EntityDataProps['value-of'],
  propLabelOf?: EntityDataProps['label-of']
) => {
  const property = getProperty(propValueOf, propLabelOf);
  const isRootProperty = rootProperties.includes(property);
  const method = getMethod(propValueOf, isRootProperty);

  return { method, property };
};

const EntityData = ({
  entity,
  templates,
  thesauri,
  'value-of': propValueOf,
  'label-of': propLabelOf,
  settings,
}: ComponentProps) => {
  const newNameGeneration = settings.collection.get('newNameGeneration') || false;
  const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauri);
  let output = <></>;

  try {
    const { property, method } = prepareData(propValueOf, propLabelOf);
    const template = templates.find(t => t?.get('_id') === entity.get('template'));
    output = <>{method({ formattedEntity, property, newNameGeneration, template })}</>;
  } catch (err) {
    logError(err, propValueOf, propLabelOf);
  }

  return output;
};

const container = connector(EntityData);
export { container as EntityData };
