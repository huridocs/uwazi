/* eslint-disable max-lines */
import stringify from 'fast-json-stable-stringify';
import { RelationsV1Collection } from '#api/relationships/RelationsV1Collection.js';
import { Template } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { IndexTypes } from '#shared/data_utils/objectIndex.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SharedId } from '#api/core/domain/entity/SharedId.js';
import {
  PropertyAssignment,
  PropertyValue,
  RelationshipEntry,
  SelectionEntry,
  TextPropertyValue,
} from '#api/core/domain/template/PropertyValue.js';
import {
  EntityTranslation,
  EntityTranslationProps,
} from '#api/core/domain/entity/EntityTranslation.js';
import date from '#api/utils/date.js';
import { EntityTranslationDoesNotExistError } from './errors.js';
import { AbstractSelectProperty } from '../template/select/AbstractSelectProperty.js';
import { EntityDTO } from './EntityDTO.js';
import { Thumbnail } from '../files/Thumbnail.js';

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
  sharedId?: string;
  icon?: Icon;
  generatedToc?: boolean;
};

type UpdateProps = {
  icon?: Icon;
  generatedToc?: boolean;
};

class Entity {
  sharedId: string;

  translations: Record<string, EntityTranslation>;

  userId?: string;

  template: Template;

  icon?: Icon;

  generatedToc?: boolean;

  constructor(private props: Props) {
    this.userId = props.userId;
    this.template = props.template;
    this.icon = props.icon;

    this.sharedId = props.sharedId || SharedId.create().value;

    this.generatedToc = props?.generatedToc;
    this.translations = this.createTranslations(props.translations);
  }

  private createTranslations(props: EntityTranslationProps[]) {
    return props.reduce((acc, translation) => {
      const entityTranslation = new EntityTranslation({
        ...translation,
        metadata: translation.metadata,
      });

      entityTranslation.mergeMetadata(this.template.createDefaultPropertyAssignments());

      return {
        ...acc,
        [translation.language]: entityTranslation,
      };
    }, {});
  }

  private validatePropertyAssignments() {
    this.template.allProperties.forEach(property =>
      this.getPropertyAssignments(property.name).forEach(pa => {
        property.validatePropertyAssignment(pa);
      })
    );
  }

  private setValue(value: PropertyAssignment, targetLanguage: LanguageISO6391) {
    if (value.isTranslatable) {
      this.setValueInLanguage(value, targetLanguage);
    } else {
      this.setValueInAllLanguages(value);
    }
  }

  private setValueInAllLanguages(value: PropertyAssignment) {
    this.translationsList.forEach(([_language, translation]) => translation.setValue(value));
  }

  private setValueInLanguage(value: PropertyAssignment, language: LanguageISO6391) {
    this.getTranslation(language).setValue(value);
  }

  private refreshEditDate() {
    const now = date.currentUTC();
    this.translationsList.forEach(([_language, translation]) => translation.refreshEditDate(now));
  }

  static create(input: CreateInput) {
    const { languages, userId, template, icon } = input;

    const translations: EntityTranslationProps[] = languages.map(language => ({
      language,
    }));

    return new Entity({ userId, translations, template, icon });
  }

  get asDTO(): EntityDTO {
    return {
      sharedId: this.sharedId,
      templateId: this.template.id,
      userId: this.userId,
      icon: this.icon,
      generatedToc: this.generatedToc,
      translations: this.translationsList.map(([_language, translation]) => translation.asDTO),
    };
  }

  get hasChanged() {
    return stringify(this.asDTO) !== stringify(this.previousVersion.asDTO);
  }

  get previousVersion() {
    return new Entity(this.props);
  }

  get translationsList() {
    return Object.entries(this.translations);
  }

  get languages(): LanguageISO6391[] {
    return Object.keys(this.translations) as LanguageISO6391[];
  }

  getTranslation(language: LanguageISO6391) {
    if (!this.translations[language]) {
      throw new EntityTranslationDoesNotExistError(language, this.languages);
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

  getRelationshipAssignmentsInheritingFromSelect(
    targetLanguage?: LanguageISO6391
  ): PropertyAssignment<SelectionEntry>[] {
    const language = targetLanguage || this.languages[0];

    const selectProperties = this.template.properties.filter(
      p =>
        p instanceof V1RelationshipProperty &&
        ['select', 'multiselect'].includes(p.inherit?.type || '')
    );

    return selectProperties.map(property =>
      this.getTranslation(language).getValue<SelectionEntry>(property.name)
    );
  }

  getSelectAssignmentsByThesaurusId(
    thesaurusId: string,
    targetLanguage?: LanguageISO6391
  ): PropertyAssignment<SelectionEntry>[] {
    const language = targetLanguage || this.languages[0];

    const selectProperties = this.template.properties.filter(
      p => p instanceof AbstractSelectProperty && p.content === thesaurusId
    );

    return selectProperties.map(property =>
      this.getTranslation(language).getValue<SelectionEntry>(property.name)
    );
  }

  setPropertyAssignments(
    propertyAssignments: PropertyAssignment[],
    targetLanguage: LanguageISO6391,
    shouldValidateForRequired = false
  ) {
    propertyAssignments.forEach(pa => this.setValue(pa, targetLanguage));

    if (shouldValidateForRequired) {
      this.validatePropertyAssignments();
    }
  }

  /**
   * Sets property assignments across all language translations of the entity.
   *
   * This method synchronizes the provided property assignments to all entity translations.
   *
   * @param propertyAssignments - Array of property assignments to set across all languages
   * @param shouldValidateForRequired - If true, validates that required properties have values. Defaults to false
   */
  setPropertyAssignmentsInAllLanguages(
    propertyAssignments: PropertyAssignment[],
    shouldValidateForRequired = false
  ) {
    propertyAssignments.forEach(pa => this.setValueInAllLanguages(pa));

    if (shouldValidateForRequired) {
      this.validatePropertyAssignments();
    }
  }

  changeTemplate(template: Template) {
    if (template.id === this.template.id) return;

    this.template = template;

    const defaultPropertyAssignments = template.createDefaultPropertyAssignments();

    this.translationsList.forEach(([_language, translation]) =>
      translation.mergeMetadata(defaultPropertyAssignments)
    );

    this.refreshEditDate();
  }

  update(props: UpdateProps) {
    if (props.icon !== this.icon || props.generatedToc !== this.generatedToc) {
      this.refreshEditDate();
    }

    this.icon = 'icon' in props ? props.icon : this.icon;
    this.generatedToc = props.generatedToc ?? this.generatedToc;
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

  getReferencedRelationshipEntitySharedIds(language: LanguageISO6391): Set<string> {
    const referenced = new Set<string>();
    for (const property of this.template.getRelationshipProperties()) {
      const assignment = this.getValue<RelationshipEntry>(property.name, language);
      for (const entry of assignment.value) {
        if (typeof entry.value === 'string') {
          referenced.add(entry.value);
        }
      }
    }
    return referenced;
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
            ...(related.icon ? { icon: related.icon } : {}),
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

  setPreview(thumbnails: Thumbnail[], defaultLanguage: LanguageISO6391): void {
    this.translationsList.forEach(([language, translation]) => {
      const match =
        thumbnails.find(t => t.language === language) ??
        thumbnails.find(t => t.language === defaultLanguage) ??
        thumbnails[0];
      translation.preview = match?.filename;
    });
  }
}

export { Entity };
export type { Icon as EntityIcon, Props as EntityProps };
