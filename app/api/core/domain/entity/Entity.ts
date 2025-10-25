import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { Template } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { IndexTypes } from 'shared/data_utils/objectIndex';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { IdGenerator } from 'api/core/libs/IdGenerator';
import { SharedId } from 'api/core/domain/entity/SharedId';
import { PropertyType } from 'api/core/domain/template/PropertyType';
import { PropertyValue } from 'api/core/domain/template/PropertyValue';
import {
  EntityTranslation,
  EntityTranslationProps,
} from 'api/core/domain/entity/EntityTranslation';

type CreateInput = {
  languages: LanguageISO6391[];
  template: Template;
  userId?: string;
};

type Icon = {
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
};

export class Entity {
  sharedId: string;

  translations: Record<string, EntityTranslation>;

  userId?: string;

  published: boolean;

  template: Template;

  icon?: Icon;

  constructor(props: Props) {
    this.userId = props.userId;
    this.template = props.template;
    this.icon = props.icon;

    this.sharedId = props.sharedId || SharedId.create().value;
    this.published = props.published || false;

    this.translations = this.createTranslations(props.translations);
  }

  private createTranslations(props: EntityTranslationProps[]) {
    return props.reduce(
      (acc, translation) => ({
        ...acc,
        [translation.language]: new EntityTranslation({
          ...translation,
          metadata: { ...this.template.createDefaultPropertyValues(), ...translation.metadata },
        }),
      }),
      {}
    );
  }

  getTranslation(language: LanguageISO6391) {
    if (!this.translations[language]) {
      throw new Error(
        `Translation for language '${language}' does not exists. ${JSON.stringify(this)}`
      );
    }
    return this.translations[language];
  }

  get translationsList() {
    return Object.entries(this.translations);
  }

  getValue(name: string, language: LanguageISO6391) {
    return this.getTranslation(language).getValue(name);
  }

  setValue(value: PropertyValue, language: LanguageISO6391) {
    const sync: PropertyType[] = ['numeric'];

    if (sync.includes(value.type)) {
      this.setValueInAllLanguages(value);
    } else {
      this.setValueInLanguage(value, language);
    }
  }

  setValues(propertyValues: PropertyValue[], language?: LanguageISO6391) {
    this.template.allProperties.forEach(property => {
      const propertyValue =
        propertyValues.find(pv => pv.name === property.name) ||
        property.createPropertyValue(
          this.getValue(property.name, language || this.languages[0]).value
        );

      if (language) {
        this.setValue(propertyValue, language);
      } else {
        this.setValueInAllLanguages(propertyValue);
      }
    });
  }

  private setValueInAllLanguages(value: PropertyValue) {
    Object.values(this.translations).forEach(e => e.setValue(value));
  }

  private setValueInLanguage(value: PropertyValue, language: LanguageISO6391) {
    this.getTranslation(language).setValue(value);
  }

  get languages(): LanguageISO6391[] {
    return Object.keys(this.translations) as LanguageISO6391[];
  }

  getTitle(language: LanguageISO6391): string {
    return this.getTranslation(language).title.value[0].value;
  }

  createMetadataValuesFromRelationships(
    properties: V1RelationshipProperty[],
    allRelations: RelationsV1Collection
  ) {
    const relationsForEntity = allRelations.getEntityRelations(this.sharedId);

    properties.forEach(property => {
      this.setValueInAllLanguages(
        property.createPropertyValue(
          Array.from(
            relationsForEntity
              .getRelationsBelongingToProperty(property)
              .uniqueByEntity()
              .map(r => ({
                value: r.entity,
                label: r.entityData.title,
              }))
          )
        )
      );
    });
  }

  denormalizeRelationshipProps(relatedEntities: Record<IndexTypes, Entity | undefined>) {
    this.template.getRelationshipProperties().forEach(property => {
      this.languages.forEach(language => {
        const current = this.getValue(property.name, language);
        const denormalizedItems = current.value.map(item => {
          const related = relatedEntities[item.value as string];
          if (!related) return item;

          const inheritedProp = related.template.properties.find(
            p => p.id.toString() === property?.inheritedPropertyId
          );

          return {
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

        this.setValue(property.createPropertyValue(denormalizedItems), language);
      });
    });
  }

  static create(input: CreateInput, idGenerator: IdGenerator) {
    const { languages, userId, template } = input;

    const translations = languages.map(language => ({
      id: idGenerator.generate(),
      language,
    }));

    const instance = new Entity({ userId, translations, template });

    return instance;
  }
}
