import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../i18n.v2/schemas/Translation... Remove this comment to see the full error message
import { TranslationDBO } from '../i18n.v2/schemas/TranslationDBO.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Property, PropertyTypes } from 'api/templates.v2/model/Property.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Relation... Remove this comment to see the full error message
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/database/s... Remove this comment to see the full error message
import { RelationshipDBOType } from '../relationships.v2/database/schemas/relationshipTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/model/Matc... Remove this comment to see the full error message
import { MatchQueryNode } from '../relationships.v2/model/MatchQueryNode.js';
import {
  EntityPointer,
  ReadableEntityPointer,
  ReadableRelationship,
  Relationship,
  // @ts-expect-error TS(2307): Cannot find module '../relationships.v2/model/Rela... Remove this comment to see the full error message
} from '../relationships.v2/model/Relationship.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../authorization.v2/model/Enti... Remove this comment to see the full error message
import { EntityPermissions, Entry } from '../authorization.v2/model/EntityPermissions.js';

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
      new Property({
        id: idMapper(name).toString(),
        type,
        label: name,
        name,
        template: idMapper(template).toString(),
      }),

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
