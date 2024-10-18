/* eslint-disable max-lines */
import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { testingDB } from 'api/utils/testing_db';
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
import { IXExtractorType } from 'shared/types/extractorType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { WithId } from 'api/odm/model';
import { TemplateSchema } from 'shared/types/templateType';
import { getV2FixturesFactoryElements } from 'api/common.v2/testing/fixturesFactory';
import { IXModelType } from 'shared/types/IXModelType';
import { PermissionSchema } from 'shared/types/permissionType';

type PartialSuggestion = Partial<Omit<IXSuggestionType, 'state'>> & {
  state?: Partial<IXSuggestionType['state']>;
};

function getIdMapper() {
  const map = new Map<string, ObjectId>();

  return function setAndGet(key: string) {
    if (!map.has(key)) map.set(key, testingDB.id() as ObjectId);

    return map.get(key)!;
  };
}

const commonProperties = (
  key: string,
  idMapper: (key: string) => ObjectId
): TemplateSchema['commonProperties'] => {
  const titleId = idMapper(`${key}Title`).toString();
  return [
    {
      _id: titleId,
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
    },
    {
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
    },
    {
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date',
    },
  ];
};

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

    idString: (key: string) => idMapper(key).toString(),

    template: (
      name: string,
      properties: (Omit<PropertySchema, 'query'> & { query?: any })[] = []
    ) => ({
      _id: idMapper(name),
      name,
      properties,
      commonProperties: commonProperties(`commonProperties${name}`, idMapper),
    }),

    entityPermission: (
      user: string,
      type: PermissionSchema['type'],
      level: PermissionSchema['level']
    ): PermissionSchema => ({
      refId: idMapper(user),
      type,
      level,
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

    // eslint-disable-next-line max-params
    entityInMultipleLanguages(
      languages: string[],
      id: string,
      template?: string,
      metadata: MetadataSchema = {},
      defaultProps: EntitySchema = {},
      propsPerLanguage:
        | {
            [key: string]: EntitySchema;
          }
        | undefined = undefined
    ): EntitySchema[] {
      return languages.map(language => {
        const props = { ...defaultProps };
        if (propsPerLanguage && language in propsPerLanguage) {
          Object.assign(props, propsPerLanguage[language]);
        }
        return this.entity(id, template, metadata, { ...props, language });
      });
    },

    inherit(name: string, content: string, property: string, props = {}): PropertySchema {
      return this.relationshipProp(name, content, {
        inherit: { property: idMapper(property).toString() },
        ...props,
      });
    },

    fileExtractedMetadata: (
      propertyName: string,
      text: string,
      rectangles = [{ top: 0, left: 0, width: 0, height: 0, page: '1' }]
    ): ExtractedMetadataSchema => ({
      name: propertyName,
      selection: {
        text,
        selectionRectangles: rectangles,
      },
    }),

    document: (entity: string, props: Partial<WithId<FileType>> = {}): WithId<FileType> => ({
      _id: idMapper(`document_for_${entity}`),
      entity,
      language: 'en',
      type: 'document',
      filename: `${entity}_document.pdf`,
      originalname: `${entity}_document.pdf`,
      ...props,
    }),

    attachment(id: string, extra: Partial<FileType> = {}): WithId<FileType> {
      return this.file(id, { ...extra, type: 'attachment' });
    },

    custom_upload(id: string, extra: Partial<FileType> = {}): WithId<FileType> {
      return this.file(id, { ...extra, type: 'custom' });
    },

    file: (id: string, extra: Partial<FileType> = {}): WithId<FileType> => ({
      filename: id,
      originalname: id,
      ...extra,
      _id: idMapper(`${id}`),
    }),

    /**
     * @deprecated too many parameters and dificult to read/use
     * convention should be id and then a partial object with the
     * desired extra params or id, something else important, extra params
     * no more than 3 params
     */
    fileDeprecated: (
      id: string,
      entity?: string | undefined,
      type?: 'custom' | 'document' | 'thumbnail' | 'attachment' | undefined,
      filename?: string | undefined,
      language: string = 'en',
      originalname: string | undefined = undefined,
      extractedMetadata: ExtractedMetadataSchema[] = []
    ): WithId<FileType> => ({
      _id: idMapper(id),
      entity,
      language,
      type,
      filename: filename || id,
      originalname: originalname || filename,
      extractedMetadata,
    }),

    relationType: (name: string): { _id: ObjectId; name: string } => ({
      _id: idMapper(name),
      name,
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

    commonProperties: () =>
      _.cloneDeep(commonProperties('default', idMapper)) as TemplateSchema['commonProperties'],

    commonPropertiesTitleId: (templateName: string) =>
      idMapper(`commonProperties${templateName}Title`).toString(),

    metadataValue: (value: PropertyValueSchema, label?: string): MetadataObjectSchema => {
      const mo: MetadataObjectSchema = { value };
      if (label) {
        mo.label = label;
      }
      return mo;
    },

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

    ixExtractor: (name: string, property: string, templates: string[] = []): IXExtractorType => ({
      _id: idMapper(name),
      name,
      property,
      templates: templates.map(idMapper),
    }),

    ixModel: (
      name: string,
      extractor: string,
      creationDate = 1,
      status: IXModelType['status'] = 'ready'
    ): IXModelType => ({
      _id: idMapper(name),
      status,
      creationDate,
      extractorId: idMapper(extractor),
    }),

    ixSuggestion(props: PartialSuggestion): IXSuggestionType {
      const { state, ...otherProps } = props;

      return {
        _id: testingDB.id(),
        entityId: testingDB.id().toString(),
        status: 'ready' as const,
        entityTemplate: testingDB.id().toString(),
        language: 'en',
        fileId: testingDB.id().toString(),
        propertyName: 'propertyName',
        extractorId: testingDB.id(),
        error: '',
        segment: '',
        suggestedValue: '',
        date: 1001,
        state: {
          withValue: true,
          withSuggestion: false,
          hasContext: false,
          processing: false,
          obsolete: false,
          error: false,
          ...state,
        },
        ...otherProps,
      };
    },

    // eslint-disable-next-line max-params
    ixSuggestion_deprecated: (
      suggestionId: string,
      extractor: string,
      entity: string,
      entityTemplate: string,
      file: string,
      property: string,
      otherProps: Partial<IXSuggestionType> = {}
    ): IXSuggestionType => ({
      _id: idMapper(suggestionId),
      status: 'ready' as const,
      entityId: entity,
      entityTemplate: idMapper(entityTemplate).toString(),
      language: 'en',
      fileId: idMapper(file),
      propertyName: property,
      extractorId: idMapper(extractor),
      error: '',
      segment: '',
      suggestedValue: '',
      date: 1,
      state: {
        withValue: true,
        withSuggestion: false,
        hasContext: false,
        processing: false,
        obsolete: false,
        error: false,
      },
      ...otherProps,
    }),

    v2: getV2FixturesFactoryElements(idMapper),
  });
}

export { getIdMapper, getFixturesFactory };
