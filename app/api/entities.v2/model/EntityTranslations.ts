import { inspect } from 'util';

// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { TemplateProperty } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/V1Relati... Remove this comment to see the full error message
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { IndexTypes } from 'shared/data_utils/objectIndex.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';

import { EntityMappers } from '../database/EntityMapper';
import { BaseMetadataValue, Entity, EntityMetadata } from './Entity';
import { MultiLanguageEntity } from './MultiLanguageEntity';

export class EntityTranslations {
  public translations: { [key in LanguageISO6391]?: Entity } = {};

  addTranslation(language: LanguageISO6391, translation: Entity): void {
    const existingTranslation = this.translations[language];
    if (existingTranslation) {
      throw new Error(`Translation for language '${language}' already exists.`);
    }

    this.translations[language] = translation;
  }

  getLanguages() {
    return Object.keys(this.translations) as LanguageISO6391[];
  }

  getTitle(language: LanguageISO6391) {
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    return this.getTranslation(language).title;
  }

  getIcon(language: LanguageISO6391) {
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    return this.getTranslation(language).icon;
  }

  getValue(property: TemplateProperty, language: LanguageISO6391): EntityMetadata[] {
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    return this.getTranslation(language).metadata[property.name] || [];
  }

  setValue(property: TemplateProperty, value: BaseMetadataValue[], language?: LanguageISO6391) {
    if (property instanceof V1RelationshipProperty) {
      this.setValueInAllLanguages(property.name, value);
    } else if (property.type === 'text') {
      this.setSingleLanguageValue(property, value, language);
    } else {
      throw new Error(`setValue is not implemented for property: ${inspect(property)}`);
    }
  }

  private setSingleLanguageValue(
    property: TemplateProperty,
    value: BaseMetadataValue[],
    language?: LanguageISO6391
  ) {
    if (!language) {
      throw new Error('language needs to be defined in order to set a specific language value');
    }
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    this.getTranslation(language).metadata[property.name] = value;
  }

  setValueInAllLanguages(propertyName: string, value: BaseMetadataValue[]) {
    this.getLanguages().forEach(language => {
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      this.getTranslation(language).metadata[propertyName] = value;
    });
  }

  denormalizeRelationshipProperty(
    property: V1RelationshipProperty,
    relatedEntities: Record<IndexTypes, MultiLanguageEntity | undefined>
  ) {
    this.getLanguages().forEach(language => {
      const currentValues = this.getValue(property, language);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      this.getTranslation(language).metadata[property.name] = currentValues.map(value => {
        const relatedEntity = relatedEntities[value.value as string];
        if (!relatedEntity) {
          return value;
        }
        const inheritedProperty = relatedEntity.template.properties.find(
          // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
          p => p.id.toString() === property?.inheritedPropertyId
        );
        return {
          ...value,
          label: relatedEntity.getTitle(language),
          icon: relatedEntity.getIcon(language),
          ...(inheritedProperty
            ? {
                inheritedValue: relatedEntity.getValue(inheritedProperty, language),
                inheritedType: inheritedProperty.type,
              }
            : {}),
        };
      });
    });
  }

  getEntitiesAsLegacySchemaArray() {
    return this.getLanguages().map(language =>
      // @ts-expect-error TS(2345): Argument of type 'Entity | undefined' is not assig... Remove this comment to see the full error message
      EntityMappers.toLegacyDTO(this.getTranslation(language))
    );
  }

  private getTranslation(language: LanguageISO6391) {
    if (!this.translations[language]) {
      throw new Error(`Translation for language '${language}' does not exists`);
    }
    return this.translations[language];
  }
}
