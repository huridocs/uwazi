/* eslint-disable react/no-multi-comp */
import { connect, ConnectedProps } from 'react-redux';
import React from 'react';
import { IStore } from 'app/istore';
import { logError } from '../utils';
import { Section } from './Section';

interface EntitySectionProps {
  'show-if'?: string;
  children: JSX.Element;
}

const mapStateToProps = ({ templates, entityView }: IStore) => ({
  entity: entityView.entity,
  templates,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntitySectionProps & MappedProps;

const getPropertyValue = (property: any, metadataProperty: any) => {
  switch (property.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'nested':
    case 'multidate':
    case 'geolocation':
      return metadataProperty.map((v: any) => v.label || v.value);
    case 'relationship': {
      let value: any[] = [];
      metadataProperty.forEach((v: any) => {
        if (v.inheritedType && v.inheritedValue) {
          const properties = getPropertyValue({ type: v.inheritedType }, v.inheritedValue);
          value = Array.isArray(properties) ? [...value, ...properties] : [...value, properties];
        } else {
          value.push(v.label || v.value);
        }
      });
      return Array.from(new Set(value));
    }
    case 'generatedid':
      return typeof metadataProperty === 'string' ? metadataProperty : metadataProperty[0].value;
    default:
      return metadataProperty[0].label || metadataProperty[0].value;
  }
};

// eslint-disable-next-line import/exports-last
export const UnwrapMetadataObject = (MetadataObject: any, Template: any) =>
  Object.keys(MetadataObject).reduce((UnwrapedMO, key) => {
    if (!MetadataObject[key].length) {
      return UnwrapedMO;
    }
    const property = Template.properties.find((p: any) => p.name === key);
    const propertyValue = getPropertyValue(property, MetadataObject[key]);
    return { ...UnwrapedMO, [key]: propertyValue };
  }, {});

// eslint-disable-next-line max-statements
const EntitySection = ({ entity, templates, children, 'show-if': showIf }: ComponentProps) => {
  const jsEntity = entity.toJS();
  const template = templates.find(t => t?.get('_id') === jsEntity.template);
  const unwrappedMetadata = UnwrapMetadataObject(jsEntity.metadata, template.toJS());
  jsEntity.metadata = unwrappedMetadata;
  try {
    const condition = JSON.parse(showIf as string);
    return (
      <Section data={[jsEntity]} showIf={condition}>
        {children}
      </Section>
    );
  } catch (e) {
    logError(e, showIf);
    return null;
  }
};

const container = connector(EntitySection);
export { container as EntitySection };
