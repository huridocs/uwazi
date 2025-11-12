import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { Template } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { IndexTypes } from 'shared/data_utils/objectIndex';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { SharedId } from 'api/core/domain/entity/SharedId';
import { PropertyType } from 'api/core/domain/template/PropertyType';
import {
  PropertyAssignment,
  PropertyValue,
  RelationshipEntry,
  TextPropertyValue,
} from 'api/core/domain/template/PropertyValue';
import {
  EntityTranslation,
  EntityTranslationProps,
} from 'api/core/domain/entity/EntityTranslation';
import { AccessGrant, EntityPermission } from './EntityPermission';
import { PermissionType } from './PermissionType';
import { AccessLevel } from './AccessLevel';

type CreateInput = {
  languages: LanguageISO6391[];
  template: Template;
  userId?: string;
  icon?: Icon;
};

type Icon = {
  id: string;
  label: string;
  type: string;
};

type Props = {
  translations: EntityTranslationProps[];
  template: Template;

  userId?: string;
  published?: boolean;
  sharedId?: string;
  icon?: Icon;
  permissions?: AccessGrant[];
};

class Entity {
  sharedId: string;

  translations: Record<string, EntityTranslation>;

  userId?: string;

  published: boolean;

  template: Template;

  icon?: Icon;

  permissions: EntityPermission;

  constructor(props: Props) {
    this.userId = props.userId;
    this.template = props.template;
    this.icon = props.icon;

    this.sharedId = props.sharedId || SharedId.create().value;
    this.published = props.published || false;
    this.permissions = new EntityPermission(props.permissions);

    this.translations = this.createTranslations(props.translations);
  }

  private createTranslations(props: EntityTranslationProps[]) {
    return props.reduce(
      (acc, translation) => ({
        ...acc,
        [translation.language]: new EntityTranslation({
          ...translation,
          metadata: {
            ...this.template.createDefaultPropertyAssignments(),
            ...translation.metadata,
          },
        }),
      }),
      {}
    );
  }

  static create(input: CreateInput) {
    const { languages, userId, template, icon } = input;

    const translations = languages.map(language => ({
      language,
    }));

    const instance = new Entity({ userId, translations, template, icon });

    if (userId) {
      instance.addGrantForCreator(userId);
    }

    return instance;
  }

  get translationsList() {
    return Object.entries(this.translations);
  }

  get languages(): LanguageISO6391[] {
    return Object.keys(this.translations) as LanguageISO6391[];
  }

  getTranslation(language: LanguageISO6391) {
    if (!this.translations[language]) {
      throw new Error(
        `Translation for language '${language}' does not exists. ${JSON.stringify(this)}`
      );
    }
    return this.translations[language];
  }

  getValue<V = PropertyValue>(name: string, language: LanguageISO6391): PropertyAssignment<V> {
    return this.getTranslation(language).getValue(name);
  }

  getTitle(language: LanguageISO6391): string {
    return this.getValue<TextPropertyValue>('title', language).value[0].value;
  }

  getPropertyAssignments(name: string): PropertyAssignment[] {
    return this.translationsList.map(([_language, translation]) => translation.metadata[name]);
  }

  addGrantForCreator(creatorId: string) {
    this.permissions = new EntityPermission([
      { refId: creatorId, type: PermissionType.User, level: AccessLevel.Write },
    ]);
  }

  setPropertyAssignments(
    propertyAssignments: PropertyAssignment[],
    targetLanguage: LanguageISO6391,
    shouldValidateForRequired = false
  ) {
    propertyAssignments.forEach(pa => this.setValue(pa, targetLanguage));

    this.validatePropertyAssignments(shouldValidateForRequired);
  }

  setPropertyAssignmentsInAllLanguages(
    propertyAssignments: PropertyAssignment[],
    shouldValidateForRequired = false
  ) {
    propertyAssignments.forEach(pa => this.setValueInAllLanguages(pa));

    this.validatePropertyAssignments(shouldValidateForRequired);
  }

  private validatePropertyAssignments(shouldValidateForRequired = false) {
    this.template.allProperties.forEach(property =>
      this.getPropertyAssignments(property.name).forEach(pa => {
        property.validatePropertyAssignment(pa, shouldValidateForRequired);
      })
    );
  }

  private setValue(value: PropertyAssignment, targetLanguage: LanguageISO6391) {
    const sync: PropertyType[] = [
      'date',
      'daterange',
      'geolocation',
      'multidate',
      'multidaterange',
      'multiselect',
      'select',
      'numeric',
      'nested',
      'relationship',
      'generatedid',
    ];

    if (sync.includes(value.type)) {
      this.setValueInAllLanguages(value);
    } else {
      this.setValueInLanguage(value, targetLanguage);
    }
  }

  private setValueInAllLanguages(value: PropertyAssignment) {
    this.translationsList.forEach(([_language, translation]) => translation.setValue(value));
  }

  private setValueInLanguage(value: PropertyAssignment, language: LanguageISO6391) {
    this.getTranslation(language).setValue(value);
  }

  createMetadataValuesFromRelationships(
    properties: V1RelationshipProperty[],
    allRelations: RelationsV1Collection
  ) {
    const relationsForEntity = allRelations.getEntityRelations(this.sharedId);

    properties.forEach(property => {
      const value = Array.from(
        relationsForEntity
          .getRelationsBelongingToProperty(property)
          .uniqueByEntity()
          .map(r => ({
            value: r.entity,
            label: r.entityData.title,
            type: 'entity',
          }))
      );

      this.languages.map(language =>
        this.setValue(property.createPropertyAssignment({ value, language }), language)
      );
    });
  }

  denormalizeRelationshipProps(relatedEntities: Record<IndexTypes, Entity | undefined>) {
    this.template.getRelationshipProperties().forEach(property => {
      this.languages.forEach(language => {
        const current = this.getValue<RelationshipEntry>(property.name, language);
        const denormalizedItems = current.value.map(item => {
          const related = relatedEntities[item.value as string];
          if (!related) return item;

          const inheritedProp = related.template.properties.find(
            p => p.id.toString() === property?.inheritedPropertyId
          );

          return {
            type: 'entity',
            value: item.value,
            label: related.getTitle(language),
            icon: related.icon,
            ...(inheritedProp
              ? {
                  inheritedValue: related.getValue(inheritedProp.name, language).value,
                  inheritedType: inheritedProp.type,
                }
              : {}),
          };
        });

        this.setValue(
          property.createPropertyAssignment({ value: denormalizedItems, language }),
          language
        );
      });
    });
  }
}

export { Entity };
export type { Icon as EntityIcon };
