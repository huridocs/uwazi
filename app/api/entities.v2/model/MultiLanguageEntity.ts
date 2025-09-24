// @ts-expect-error TS(2307): Cannot find module '../relationships/RelationsV1Co... Remove this comment to see the full error message
import { RelationsV1Collection } from '../relationships/RelationsV1Collection.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template, TemplateProperty } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/V1Relati... Remove this comment to see the full error message
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { IndexTypes } from 'shared/data_utils/objectIndex.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
import { Entity } from './Entity';
import { EntityTranslations } from './EntityTranslations';

export class MultiLanguageEntity {
  public translations: EntityTranslations;

  private _template?: Template;

  constructor(
    public sharedId: string,
    public templateId: string
  ) {
    this.translations = new EntityTranslations();
  }

  get template(): Template {
    if (!this._template) {
      throw new Error('Template has not been set');
    }
    return this._template;
  }

  withTemplate(template: Template) {
    this._template = template;
  }

  addTranslation(language: LanguageISO6391, translation: Entity): void {
    this.translations.addTranslation(language, translation);
  }

  getEntitiesAsLegacySchemaArray() {
    return this.translations.getEntitiesAsLegacySchemaArray();
  }

  getLanguages() {
    return this.translations.getLanguages();
  }

  getTitle(language: LanguageISO6391) {
    return this.translations.getTitle(language);
  }

  getIcon(language: LanguageISO6391) {
    return this.translations.getIcon(language);
  }

  getValue(property: TemplateProperty, language: LanguageISO6391) {
    return this.translations.getValue(property, language);
  }

  createMetadataValuesFromRelationships(
    properties: V1RelationshipProperty[],
    allRelations: RelationsV1Collection
  ) {
    const relationsForEntity = allRelations.getEntityRelations(this.sharedId);

    properties.forEach(property => {
      this.translations.setValue(
        property,
        Array.from(
          relationsForEntity
            .getRelationsBelongingToProperty(property)
            .uniqueByEntity()
            // @ts-expect-error TS(7006): Parameter 'r' implicitly has an 'any' type.
            .map(r => ({
              value: r.entity,
              label: r.entityData.title,
            }))
        )
      );
    });

    return this;
  }

  denormalizeRelationshipProps(
    relatedEntities: Record<IndexTypes, MultiLanguageEntity | undefined>
  ) {
    // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
    this.template.getRelationshipProperties().forEach(property => {
      this.translations.denormalizeRelationshipProperty(property, relatedEntities);
    });
    return this;
  }
}
