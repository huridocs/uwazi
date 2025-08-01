import { RelationsV1Collection } from 'api/relationships/RelationsV1Collection';
import { Template, TemplateProperty } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { IndexTypes } from 'shared/data_utils/objectIndex';
import { LanguageISO6391 } from 'shared/types/commonTypes';
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
