/* eslint-disable no-redeclare */
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { CommonPropertyFactory } from 'api/core/domain/template/CommonPropertyFactory';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';
import { Property } from '../../../domain/template/Property';
import { RelationshipProperty } from '../../../domain/template/RelationshipProperty';
import { Template } from '../../../domain/template/Template';
import { V1RelationshipProperty } from '../../../domain/template/V1RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TraverseQueryDBO } from './DBOs/RelationshipsQueryDBO';
import { RelationshipPropertyDBO, TemplateDBO } from './DBOs/TemplateDBO';

type PropertyDBO = TemplateDBO['properties'][number];

function propertyToApp(
  property: RelationshipPropertyDBO,
  _templateId: TemplateDBO['_id']
): RelationshipProperty;
//@ts-ignore
function propertyToApp(property: PropertySchema, _templateId: TemplateDBO['_id']): Property;
function propertyToApp(property: PropertyDBO, _templateId: TemplateDBO['_id']): Property {
  const templateId = MongoIdHandler.mapToApp(_templateId);
  const propertyId = property._id?.toString() || MongoIdHandler.generate();
  if ('isCommonProperty' in property && property.isCommonProperty) {
    return CommonPropertyFactory.create(
      {
        id: propertyId,
        type: property.type,
        name: property.name,
        label: property.label,
        template: templateId,
      },
      { newNameGeneration: true }
    );
    // return new CommonProperty({
    //   id: propertyId,
    //   type: property.type,
    //   name: property.name,
    //   label: property.label,
    //   template: templateId,
    // });
  }
  switch (property.type) {
    case propertyTypes.newRelationship:
      return new RelationshipProperty(
        propertyId,
        property.name,
        property.label,
        mapPropertyQuery(property.query as TraverseQueryDBO[]),
        templateId,
        property.denormalizedProperty
      );
    case propertyTypes.relationship:
      if (!property.relationType) throw new Error('Relation type is required');
      return new V1RelationshipProperty(
        propertyId,
        property.name,
        property.label,
        property.relationType,
        templateId,
        property.content,
        property.inherit?.property
      );
    default:
      return new Property({
        id: propertyId,
        type: property.type,
        name: property.name,
        label: property.label,
        template: templateId,
      });
  }
}

const TemplateMappers = {
  propertyToApp,
  toApp: (tdbo: TemplateDBO): Template => {
    const template = new Template(
      MongoIdHandler.mapToApp(tdbo._id),
      tdbo.name,
      tdbo.properties.map(p => propertyToApp(p, tdbo._id)),
      tdbo.commonProperties.map(p => propertyToApp(p, tdbo._id) as any), // TODO: remove as any
      tdbo.color || '',
      tdbo.default
    );
    template.processing = tdbo.processing;
    return template;
  },
};

export { TemplateMappers };
