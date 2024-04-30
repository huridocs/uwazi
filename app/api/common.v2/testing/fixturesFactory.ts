import { ObjectId } from 'mongodb';

import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { Property, PropertyTypes } from 'api/templates.v2/model/Property';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { RelationshipDBOType } from 'api/relationships.v2/database/schemas/relationshipTypes';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import {
  EntityPointer,
  ReadableEntityPointer,
  ReadableRelationship,
  Relationship,
} from 'api/relationships.v2/model/Relationship';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { EntityPermissions, Entry } from 'api/authorization.v2/model/EntityPermissions';

type idMapperFunction = (id: string) => ObjectId;

const entityPointer = (entity: string): EntityPointer => new EntityPointer(entity);

const entityPointerWithEntityData = (
  entity: string,
  entityTitle: string,
  entityTemplateName: string
): ReadableEntityPointer => new ReadableEntityPointer(entity, entityTitle, entityTemplateName);

const nestedTranslationContextDBO =
  (idMapper: idMapperFunction) =>
  (label?: string, type?: TranslationDBO['context']['type']): TranslationDBO['context'] => ({
    id: label ? idMapper(label).toString() : 'System',
    type: label ? type || 'Thesaurus' : 'Uwazi UI',
    label: label || 'User Interface',
  });

const getV2FixturesFactoryElements = (idMapper: idMapperFunction) => ({
  application: {
    property: (name: string, type: PropertyTypes, template: string): Property =>
      new Property(idMapper(name).toString(), type, name, name, idMapper(template).toString()),

    relationshipProperty: (
      name: string,
      template: string,
      query: MatchQueryNode['traversals'],
      denormalizedProperty?: string
    ): RelationshipProperty =>
      new RelationshipProperty(
        idMapper(name).toString(),
        name,
        name,
        query,
        idMapper(template).toString(),
        denormalizedProperty
      ),

    entityPointer,

    relationship: (name: string, from: string, to: string, type: string): Relationship =>
      new Relationship(
        idMapper(name).toString(),
        entityPointer(from),
        entityPointer(to),
        idMapper(type).toString()
      ),

    readableRelationship: (
      name: string,
      from: string,
      fromTitle: string,
      fromTemplateName: string,
      to: string,
      toTitle: string,
      toTemplateName: string,
      type: string,
      relationshipTypeName: string
    ): Relationship =>
      new ReadableRelationship(
        idMapper(name).toString(),
        entityPointerWithEntityData(from, fromTitle, fromTemplateName),
        entityPointerWithEntityData(to, toTitle, toTemplateName),
        idMapper(type).toString(),
        relationshipTypeName
      ),

    entityPermissions: (entity: string, published: boolean, permissions: Entry[] = []) => {
      const entries = permissions.map(permission => ({
        refId: idMapper(permission.refId).toString(),
        type: permission.type,
        level: permission.level,
      }));
      return new EntityPermissions(entity, entries, published);
    },
  },

  database: {
    relationshipDBO: (
      name: string,
      from: string,
      to: string,
      type: string
    ): RelationshipDBOType => ({
      _id: idMapper(name),
      from: { entity: from },
      to: { entity: to },
      type: idMapper(type),
    }),

    nestedTranslationContextDBO: nestedTranslationContextDBO(idMapper),

    translationDBO: (
      key: string,
      value: string,
      language: LanguageISO6391,
      context: TranslationDBO['context'] = nestedTranslationContextDBO(idMapper)()
    ): TranslationDBO => ({
      _id: idMapper(`${key}-${language}-${context.id}`),
      key,
      value,
      language,
      context,
    }),
  },

  api: {},
});

export { getV2FixturesFactoryElements };
