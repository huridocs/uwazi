// TEST!!!
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { IStore } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';
import { safeName } from 'shared/propertyNames';
import { showByType } from 'app/Metadata/components/Metadata';

export interface EntityDataProps {
  value?: string;
  propertyName?: string;
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

const extractRootProperty = (formattedEntity: any, property: string) => formattedEntity[property];

const extractMetadataProperty = (
  formattedEntity: any,
  property: string = '',
  newNameGeneration: boolean
) => {
  const propertyData = formattedEntity.metadata.find(
    (p: any) => p.name === safeName(property, newNameGeneration)
  );
  return showByType(propertyData, false);
};

const logError = (err: any, value?: string, propertyName?: string) => {
  /* eslint-disable no-console */
  console.log('Error on EntityData: ');
  console.log('value: ', value, '; propertyName: ', propertyName);
  console.log(err);
  /* eslint-enable no-console */
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
    switch (value) {
      case 'title':
      case 'creationDate':
      case 'editDate':
        output = <>{extractRootProperty(formattedEntity, value)}</>;
        break;
      default:
        output = <>{extractMetadataProperty(formattedEntity, value, newNameGeneration)}</>;
    }
  } catch (err) {
    logError(err, value, propertyName);
  }

  return output;
};

const container = connector(EntityData);
export { container as EntityData };
