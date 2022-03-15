import { safeName } from 'shared/propertyNames';
import { showByType } from 'app/Metadata/components/Metadata';
import { ensure } from 'shared/tsUtils';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTemplateSchema } from 'app/istore';
import { Translate } from 'app/I18N';
import React from 'react';
import { EntityDataProps } from './components/EntityData';

interface Options {
  formattedEntity: any;
  propertyName: string;
  newNameGeneration: boolean;
  template?: IImmutable<ClientTemplateSchema>;
}

const objectPath = (path: any, object: any) =>
  path.split('.').reduce((o: any, key: any) => {
    if (!o || !key) {
      return o;
    }
    return o.toJS ? o.get(key) : o[key];
  }, object);

const rootProperties = ['title', 'creationDate', 'editDate'];

const getPropertyData = ({ formattedEntity, propertyName, newNameGeneration }: Options) =>
  formattedEntity.metadata.find((p: any) => p.name === safeName(propertyName, newNameGeneration));

const extractRootProperty = ({ formattedEntity, propertyName }: Options) =>
  formattedEntity[propertyName];

const extractMetadataProperty = ({ formattedEntity, propertyName, newNameGeneration }: Options) => {
  const propertyData = formattedEntity.metadata.find(
    (p: any) => p.name === safeName(propertyName, newNameGeneration)
  );
  return showByType(propertyData, false);
};

const extractRootLabel = ({ propertyName, template: _template }: Options) => {
  const template = ensure<IImmutable<ClientTemplateSchema>>(_template);
  const term =
    template
      .get('commonProperties')
      ?.find(p => p?.get('name') === propertyName)
      .get('label') || '';

  const context = propertyName === 'title' ? template.get('_id') : 'System';
  return <Translate context={context}>{term}</Translate>;
};

const extractMetadataLabel = ({ formattedEntity, propertyName, newNameGeneration }: Options) => {
  const propertyData = getPropertyData({ formattedEntity, propertyName, newNameGeneration });
  return <Translate context={propertyData.translateContext}>{propertyData.label}</Translate>;
};

const logError = (err: any, propValueOf?: string, propLabelOf?: string) => {
  /* eslint-disable no-console */
  console.error('Error on EntityData: ');
  console.error('value-of: ', propValueOf, '; label-of: ', propLabelOf);
  console.error(err);
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

const getMethod = (propValueOf: string | undefined, propertyName: string) => {
  const isRootProperty = rootProperties.includes(propertyName);

  if (propValueOf) {
    return isRootProperty ? extractRootProperty : extractMetadataProperty;
  }

  return isRootProperty ? extractRootLabel : extractMetadataLabel;
};

export {
  objectPath,
  getPropertyData,
  extractRootProperty,
  extractMetadataProperty,
  extractRootLabel,
  extractMetadataLabel,
  logError,
  getProperty,
  getMethod,
};
