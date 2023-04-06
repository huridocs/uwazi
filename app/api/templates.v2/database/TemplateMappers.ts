import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { propertyTypes } from 'shared/propertyTypes';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { mapPropertyQuery } from './QueryMapper';
import { TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';
import { TemplateDBO } from './schemas/TemplateDBO';

type PropertyDBO = TemplateDBO['properties'][number];

type TemplateInput = TemplateSchema;

const propertyApiToApp = (property: PropertySchema, templateId: string): Property => {
  const propertyId = property._id?.toString() || MongoIdHandler.generate();
  if (property.type === propertyTypes.newRelationship) {
    return new RelationshipProperty(
      propertyId,
      property.name,
      property.label,
      mapPropertyQuery(property.query as TraverseQueryDBO[]),
      templateId,
      property.denormalizedProperty
    );
  }
  return new Property(propertyId, property.type, property.name, property.label, templateId);
};

const propertyDBOToApp = (property: PropertyDBO, _templateId: TemplateDBO['_id']): Property => {
  const templateId = MongoIdHandler.mapToApp(_templateId);
  return propertyApiToApp(property, templateId);
};

export const TemplateMappers = {
  propertyApiToApp,
  propertyDBOToApp,
  DBOToApp: (tdbo: TemplateDBO): Template =>
    new Template(
      MongoIdHandler.mapToApp(tdbo._id),
      tdbo.name,
      tdbo.properties.map(p => propertyDBOToApp(p, tdbo._id))
    ),

  ApiToApp: (template: TemplateInput): Template => {
    const id = template._id?.toString() || MongoIdHandler.generate();
    return new Template(
      id,
      template.name,
      template.properties?.map(p => propertyApiToApp(p, id)) || []
    );
  },
};

export type { TemplateInput };
