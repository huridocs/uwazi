/* eslint-disable no-redeclare */
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Common... Remove this comment to see the full error message
import { CommonPropertyFactory } from '../core/domain/template/CommonPropertyFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';

import { PropertySchema } from 'shared/types/commonTypes.js';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { V1RelationshipProperty } from '../model/V1RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';
import { TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';
import { RelationshipPropertyDBO, TemplateDBO } from './schemas/TemplateDBO';

type PropertyDBO = TemplateDBO['properties'][number];

function propertyToApp(
  property: RelationshipPropertyDBO,
  _templateId: TemplateDBO['_id']
): RelationshipProperty;
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
      // @ts-expect-error TS(2740): Type 'V1RelationshipProperty' is missing the follo... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TemplateDB... Remove this comment to see the full error message
      tdbo.name,
      tdbo.properties.map(p => propertyToApp(p, tdbo._id)),
      tdbo.commonProperties.map(p => propertyToApp(p, tdbo._id) as any), // TODO: remove as any
      // @ts-expect-error TS(2339): Property 'color' does not exist on type 'TemplateD... Remove this comment to see the full error message
      tdbo.color || '',
      // @ts-expect-error TS(2339): Property 'default' does not exist on type 'Templat... Remove this comment to see the full error message
      tdbo.default
    );
    // @ts-expect-error TS(2339): Property 'processing' does not exist on type 'Temp... Remove this comment to see the full error message
    template.processing = tdbo.processing;
    return template;
  },
};

export { TemplateMappers };
