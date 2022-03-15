/* eslint-disable react/no-multi-comp */
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IStore } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';
import { getProperty, getMethod, logError } from '../utils.tsx';
interface EntityDataProps {
  'value-of'?: string;
  'label-of'?: string;
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
export type { EntityDataProps };
