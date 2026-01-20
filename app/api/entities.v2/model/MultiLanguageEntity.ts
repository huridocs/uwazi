import { RelationsV1Collection } from '#api/relationships/RelationsV1Collection.js';

import { Template, TemplateProperty } from '#api/core/domain/template/Template.js';

import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';

import { IndexTypes } from '#shared/data_utils/objectIndex.js';

import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Entity } from '#api/entities.v2/model/Entity.js';
import { EntityTranslations } from '#api/entities.v2/model/EntityTranslations.js';

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
    this.template.getRelationshipProperties().forEach(property => {
      this.translations.denormalizeRelationshipProperty(property, relatedEntities);
    });
    return this;
  }
}
