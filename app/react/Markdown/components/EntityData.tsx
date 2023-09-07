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
import { logError } from '../utils';
export interface EntityDataProps {
  'value-of'?: string;
  'label-of'?: string;
}

interface Options {
  formattedEntity: any;
  propertyName: string;
  newNameGeneration: boolean;
  template?: IImmutable<ClientTemplateSchema>;
}

const mapStateToProps = ({ entityView, templates, thesauris, settings }: IStore) => ({
  entity: entityView.entity,
  templates,
  thesauri: thesauris,
  newNameGeneration: settings.collection.get('newNameGeneration') || false,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntityDataProps & MappedProps;

const rootProperties = ['title', 'creationDate', 'editDate'];

const getPropertyData = ({ formattedEntity, propertyName, newNameGeneration }: Options) =>
  formattedEntity.metadata.find((p: any) => p.name === safeName(propertyName, newNameGeneration));

const extractRootProperty = ({ formattedEntity, propertyName }: Options) =>
  formattedEntity[propertyName];

const extractMetadataProperty = ({ formattedEntity, propertyName, newNameGeneration }: Options) => {
  const propertyData = formattedEntity.metadata.find(
    (p: any) => p.name === safeName(propertyName, newNameGeneration)
  );
  return showByType({ prop: propertyData, compact: false });
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

const EntityData = ({
  entity,
  templates,
  thesauri,
  'value-of': propValueOf,
  'label-of': propLabelOf,
  newNameGeneration,
}: ComponentProps) => {
  const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauri);
  const template = templates.find(t => t?.get('_id') === entity.get('template'));
  // eslint-disable-next-line react/jsx-no-useless-fragment
  let output = <></>;

  try {
    const propertyName = getProperty(propValueOf, propLabelOf);
    const renderMethod = getMethod(propValueOf, propertyName);
    output = <>{renderMethod({ formattedEntity, propertyName, newNameGeneration, template })}</>;
  } catch (err) {
    logError(err, propValueOf, propLabelOf);
  }

  return output;
};

const container = connector(EntityData);
export { container as EntityData };
