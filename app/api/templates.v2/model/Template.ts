// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { objectIndex } from 'shared/data_utils/objectIndex.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/Validator.js' o... Remove this comment to see the full error message
import { Validator } from '../core/domain/Validator.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/templa... Remove this comment to see the full error message
import { TemplateWithDuplicatedPropertyValidator } from '../core/domain/template/templateValidator/TemplateWithDuplicatedPropertyValidator.js';
import { Property, PropertyTypes, PropertyUpdateInfo } from './Property';
import { V1RelationshipProperty } from './V1RelationshipProperty';
import { CommonProperty } from './CommonProperty';

type TemplateProperty = Property | V1RelationshipProperty;

class Template {
  readonly id: string;

  readonly name: string;

  readonly properties: TemplateProperty[] = [];

  readonly commonProperties: CommonProperty[] = [];

  private _processing: {
    active?: boolean;
    totalJobs?: number;
    completedJobs?: number;
  } = {
    active: false,
  };

  readonly entityViewPage: string;

  color?: string;

  isDefault: boolean;

  constructor(
    id: string,
    name: string,
    properties: Property[],
    commonProperties: CommonProperty[],
    color?: string,
    isDefault?: boolean,
    entityViewPage?: string
  ) {
    this.id = id;
    this.name = name;
    this.properties = properties;
    this.commonProperties = commonProperties;
    this.color = color ?? '';
    this.isDefault = isDefault ?? false;
    this.entityViewPage = entityViewPage ?? '';

    this.validate();
  }

  get allProperties() {
    return [...this.commonProperties, ...this.properties];
  }

  set processing(
    processing: { active?: boolean; totalJobs?: number; completedJobs?: number } | undefined
  ) {
    this._processing = processing || { active: false };
  }

  get processing() {
    return this._processing;
  }

  private validate() {
    const validator = new Validator([
      new TemplateWithDuplicatedPropertyValidator(),
      // new TemplateWithMissingCommonPropertyValidator(),
    ]);

    validator.validate(this);
  }

  ensurePropertyIsConsistent(property: Property) {
    this.properties.forEach(
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TemplatePr... Remove this comment to see the full error message
      p => p.name === property.name && p.ensurePropertyIsConsistent(property as any)
    );
  }

  selectNewProperties(newTemplate: Template): Property[] {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'TemplateProp... Remove this comment to see the full error message
    const oldIdSet = new Set(this.properties.map(p => p.id));
    // @ts-expect-error TS(2322): Type 'TemplateProperty[]' is not assignable to typ... Remove this comment to see the full error message
    return newTemplate.properties.filter(p => !oldIdSet.has(p.id));
  }

  selectUpdatedProperties(newTemplate: Template): PropertyUpdateInfo[] {
    const oldPropertiesById = objectIndex(
      this.properties.concat(this.commonProperties),
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      p => p.id,
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      p => p
    );
    const newProperties = newTemplate.properties
      .concat(newTemplate.commonProperties)
      // @ts-expect-error TS(2339): Property 'id' does not exist on type 'TemplateProp... Remove this comment to see the full error message
      .filter(p => p.id in oldPropertiesById);
    const newPropertiesById = objectIndex(
      newProperties,
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      p => p.id,
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      p => p
    );
    const updateInfo = Object.entries(newPropertiesById)
      .map(([id, newProperty]) => {
        const oldProperty = oldPropertiesById[id];
        return oldProperty.updatedAttributes(newProperty);
      })
      .filter(info => info.updatedAttributes.length > 0);
    return updateInfo;
  }

  selectSwappedNameProperties(newTemplate: Template) {
    let swapingNameWithExistingProperty: TemplateProperty | undefined;
    this.properties.forEach(prop => {
      if (!swapingNameWithExistingProperty) {
        swapingNameWithExistingProperty = (newTemplate.properties || []).find(
          // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TemplatePr... Remove this comment to see the full error message
          p => p.name === prop.name && p.id?.toString() !== prop.id?.toString()
        );
      }
    });
    return swapingNameWithExistingProperty;
  }

  selectRelationshipPropsWithRelationshipChanges(newTemplate: Template): V1RelationshipProperty[] {
    const v1Props = ['relationType', 'content', 'inheritedPropertyId'];
    return this.selectUpdatedProperties(newTemplate)
      .filter(update => update.updatedAttributes.some(attr => v1Props.includes(attr)))
      .map(update => newTemplate.getPropertyById(update.id))
      .filter(
        (newProperty): newProperty is V1RelationshipProperty =>
          newProperty instanceof V1RelationshipProperty
      );
  }

  selectPropertiesWhereNameHasChanged(newTemplate: Template): PropertyUpdateInfo[] {
    return this.selectUpdatedProperties(newTemplate).filter(update =>
      update.updatedAttributes.includes('name')
    );
  }

  selectDeletedProperties(newTemplate: Template): Property[] {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'TemplateProp... Remove this comment to see the full error message
    const newPropertyIds = new Set(newTemplate.properties.map(p => p.id));
    // @ts-expect-error TS(2322): Type 'TemplateProperty[]' is not assignable to typ... Remove this comment to see the full error message
    return this.properties.filter(p => !newPropertyIds.has(p.id));
  }

  getPropertyById(propertyId: string) {
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'TemplateProp... Remove this comment to see the full error message
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      return property;
    }

    const commonProperty = this.commonProperties.find(p => p.id === propertyId);
    if (commonProperty) {
      return commonProperty;
    }

    return null;
  }

  getPropertiesByType(type: PropertyTypes) {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TemplatePr... Remove this comment to see the full error message
    return this.properties.filter(p => p.type === type);
  }

  getRelationshipProperties(): V1RelationshipProperty[] {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'TemplatePr... Remove this comment to see the full error message
    return this.properties.filter((p): p is V1RelationshipProperty => p.type === 'relationship');
  }
}

export type { TemplateProperty };
export { Template };
