// TEST!!!
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { IStore } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';

export interface CurrentEntityProps {
  value?: string;
  propertyName?: string;
}

const mapStateToProps = ({ entityView, templates, thesauris }: IStore) => ({
  entity: entityView.entity,
  templates,
  thesauri: thesauris,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = CurrentEntityProps & MappedProps;

const extractRootProperty = (formattedEntity: any, property: string) => formattedEntity[property];

const extractMetadataProperty = (formattedEntity: any, property?: string) => {
  const propertyData = formattedEntity.metadata.find((p: any) => p.name === property);
  return propertyData.value;
};

const logError = (err: any, value?: string, propertyName?: string) => {
  /* eslint-disable no-console */
  console.log('Error on CurrentEntity: ');
  console.log('value: ', value, '; propertyName: ', propertyName);
  console.log(err);
  /* eslint-enable no-console */
};

const CurrentEntity = ({ entity, templates, thesauri, value, propertyName }: ComponentProps) => {
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
        output = <>{extractMetadataProperty(formattedEntity, value)}</>;
    }
  } catch (err) {
    logError(err, value, propertyName);
  }

  return output;
};

const container = connector(CurrentEntity);
export { container as CurrentEntity };
