/* eslint-disable react/no-multi-comp */
// TEST!!!
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
  value?: string;
  propertyName?: string;
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

const logError = (err: any, value?: string, propertyName?: string) => {
  /* eslint-disable no-console */
  console.log('Error on EntityData: ');
  console.log('value: ', value, '; propertyName: ', propertyName);
  console.log(err);
  /* eslint-enable no-console */
};

const getProperty = (
  value?: EntityDataProps['value'],
  propertyName?: EntityDataProps['propertyName']
) => {
  if (value && propertyName) {
    throw new Error('Can\'t provide both "value" and "propertyName".');
  }

  const property = value || propertyName;

  if (!property) {
    throw new Error('"value" or "propertyName" must be provided.');
  }

  return property;
};

const prepareData = (
  value?: EntityDataProps['value'],
  propertyName?: EntityDataProps['propertyName']
) => {
  const property = getProperty(value, propertyName);

  const isRootProperty = rootProperties.includes(property);

  let method: Function = () => {};

  if (value) {
    method = isRootProperty ? extractRootProperty : extractMetadataProperty;
  } else {
    method = isRootProperty ? extractRootLabel : extractMetadataLabel;
  }

  return { method, property };
};

const EntityData = ({
  entity,
  templates,
  thesauri,
  value,
  propertyName,
  settings,
}: ComponentProps) => {
  const newNameGeneration = settings.collection.get('newNameGeneration') || false;
  const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauri);
  let output = <></>;

  try {
    const { property, method } = prepareData(value, propertyName);
    const template = templates.find(t => t?.get('_id') === entity.get('template'));
    output = <>{method({ formattedEntity, property, newNameGeneration, template })}</>;
  } catch (err) {
    logError(err, value, propertyName);
  }

  return output;
};

const container = connector(EntityData);
export { container as EntityData };
