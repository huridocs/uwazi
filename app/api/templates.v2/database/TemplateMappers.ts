import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { propertyTypes } from 'shared/propertyTypes';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { Template } from '../model/Template';
import { mapPropertyQuery } from './QueryMapper';
import { TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';
import { TemplateDBO } from './schemas/TemplateDBO';

type PropertyDBO = TemplateDBO['properties'][number];

const propertyToApp = (property: PropertyDBO, _templateId: TemplateDBO['_id']): Property => {
  const templateId = MongoIdHandler.mapToApp(_templateId);
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

const TemplateMappers = {
  propertyToApp,
  toApp: (tdbo: TemplateDBO): Template =>
    new Template(
      MongoIdHandler.mapToApp(tdbo._id),
      tdbo.name,
      tdbo.properties.map(p => propertyToApp(p, tdbo._id))
    ),
};

export { TemplateMappers };
