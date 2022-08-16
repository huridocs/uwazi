import { ObjectId } from 'mongodb';
import db from 'api/utils/testing_db';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import {
  PropertySchema,
  MetadataSchema,
  PropertyValueSchema,
  MetadataObjectSchema,
  ExtractedMetadataSchema,
} from 'shared/types/commonTypes';
import { UpdateLog } from 'api/updatelogs';

function getIdMapper() {
  const map = new Map<string, ObjectId>();

  return function setAndGet(key: string) {
    if (!map.has(key)) map.set(key, db.id() as ObjectId);

    return map.get(key)!;
  };
}

const thesaurusNestedValues = (
  rootValue: string,
  children: Array<string>,
  idMapper: (key: string) => ObjectId
) => {
  const nestedValues = children.map(nestedValue => ({
    _id: idMapper(nestedValue),
    id: nestedValue,
    label: nestedValue,
  }));
  return { _id: idMapper(rootValue), id: rootValue, label: rootValue, values: nestedValues };
};

function getFixturesFactory() {
  const idMapper = getIdMapper();

  return Object.freeze({
    id: idMapper,

    template: (name: string, properties: PropertySchema[] = []) => ({
      _id: idMapper(name),
      name,
      properties,
    }),

    entity: (
      id: string,
      template?: string,
      metadata: MetadataSchema = {},
      props: EntitySchema = { language: 'en' }
    ): EntitySchema => {
      const language = props.language || 'en';
      return {
        _id: idMapper(`${id}-${language}`),
        sharedId: id,
        title: `${id}`,
        ...(template ? { template: idMapper(template) } : {}),
        metadata,
        language,
        ...props,
      };
    },

    inherit(name: string, content: string, property: string, props = {}): PropertySchema {
      return this.relationshipProp(name, content, {
        inherit: { property: idMapper(property).toString() },
        ...props,
      });
    },

    file: (
      id: string,
      entity: string | undefined,
      type: 'custom' | 'document' | 'thumbnail' | 'attachment' | undefined,
      filename: string,
      language: string = 'en',
      originalname: string | undefined = undefined,
      extractedMetadata: ExtractedMetadataSchema[] = []
    ): FileType => ({
      _id: idMapper(`${id}`),
      entity,
      language,
      type,
      filename,
      originalname: originalname || filename,
      extractedMetadata,
    }),

    relationshipProp(name: string, content: string, props = {}): PropertySchema {
      return this.property(name, 'relationship', {
        relationType: idMapper('rel1').toString(),
        content: idMapper(content).toString(),
        ...props,
      });
    },

    property: (
      name: string,
      type: PropertySchema['type'] = 'text',
      props = {}
    ): PropertySchema => ({
      _id: idMapper(name),
      label: name,
      name,
      type,
      ...props,
    }),

    metadataValue: (value: PropertyValueSchema): MetadataObjectSchema => ({
      value,
    }),

    thesauri: (name: string, values: Array<string | [string, string]>) => ({
      name,
      _id: idMapper(name),
      values: values.map(value =>
        typeof value === 'string'
          ? { _id: idMapper(value), id: value, label: value }
          : { _id: idMapper(value[0]), id: value[0], label: value[1] }
      ),
    }),

    nestedThesauri: (name: string, values: Array<{ [k: string]: Array<string> } | string>) => {
      const thesaurusValues = values.reduce(
        (accumulator: ThesaurusValueSchema[], item: { [k: string]: Array<string> } | string) => {
          const nestedItems =
            typeof item === 'string'
              ? [{ _id: idMapper(item), id: item, label: item }]
              : Object.entries(item).map(([rootValue, children]) =>
                  thesaurusNestedValues(rootValue, children, idMapper)
                );
          return [...accumulator, ...nestedItems];
        },
        []
      );
      return {
        name,
        _id: idMapper(name),
        values: thesaurusValues,
      };
    },

    user: (username: string, role?: UserRole, email?: string, password?: string): UserSchema => ({
      username,
      _id: idMapper(username),
      role: role || UserRole.COLLABORATOR,
      email: email || `${username}@provider.tld`,
      password,
    }),

    updatelog: (
      namespace: string,
      mongoId: string,
      deleted = false,
      timestamp = Date.now()
    ): Partial<UpdateLog> => ({
      _id: idMapper(`${namespace}-${mongoId}`),
      namespace,
      mongoId: idMapper(mongoId),
      timestamp,
      deleted,
    }),
  });
}

export { getIdMapper, getFixturesFactory };
