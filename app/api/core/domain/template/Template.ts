import { objectIndex } from 'shared/data_utils/objectIndex';
import { Validator } from 'api/core/domain/Validator';
import { TemplateWithDuplicatedPropertyValidator } from 'api/core/domain/template/templateValidator/TemplateWithDuplicatedPropertyValidator';
import {
  DefaultTemplateConflictError,
  PropertyNotFoundError,
} from 'api/core/domain/template/errors';
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { Result } from 'api/core/libs/Result';
import { CreatePropertyAssignmentInput, Property, PropertyUpdateInfo } from './Property';
import { V1RelationshipProperty } from './V1RelationshipProperty';
import { CommonProperty } from './CommonProperty';
import { PropertyType } from './PropertyType';
import { TemplateWithMissingCommonPropertyValidator } from './templateValidator/TemplateWithMissingCommonPropertyValidator';
import { PropertyAssignment } from './PropertyValue';

type CloneProps = {
  name?: string;
  properties?: Property[];
  commonProperties?: CommonProperty[];
  color?: string;
  default?: boolean;
  entityViewPage?: string;
};

class Template {
  readonly id: string;

  readonly name: string;

  properties: Property[] = [];

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

  isDefault?: boolean;

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
    this.isDefault = isDefault;
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
      new TemplateWithMissingCommonPropertyValidator(),
    ]);

    validator.validate(this);
  }

  ensurePropertyIsConsistent(property: Property) {
    this.properties.forEach(
      p => p.name === property.name && p.ensurePropertyIsConsistent(property as any)
    );
  }

  selectNewProperties(newTemplate: Template): Property[] {
    const oldIdSet = new Set(this.properties.map(p => p.id));
    return newTemplate.properties.filter(p => !oldIdSet.has(p.id));
  }

  selectUpdatedProperties(newTemplate: Template): PropertyUpdateInfo[] {
    const oldPropertiesById = objectIndex(
      this.properties.concat(this.commonProperties),
      p => p.id,
      p => p
    );
    const newProperties = newTemplate.properties
      .concat(newTemplate.commonProperties)
      .filter(p => p.id in oldPropertiesById);
    const newPropertiesById = objectIndex(
      newProperties,
      p => p.id,
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

  private checkForConflictingPropertyNames(newTemplate: Template) {
    let property: Property | undefined;

    this.properties.forEach(prop => {
      if (!property) {
        property = (newTemplate.properties || []).find(
          p => p.name === prop.name && p.id?.toString() !== prop.id?.toString()
        );
      }
    });

    if (property) {
      throw new ValidationError([{ path: property.name, message: 'Properties cannot swap names' }]);
    }
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
    const newPropertyIds = new Set(newTemplate.properties.map(p => p.id));
    return this.properties.filter(p => !newPropertyIds.has(p.id));
  }

  getPropertyById(propertyId: string) {
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

  getPropertyByName<T = Property>(propertyName: string) {
    const property = this.allProperties.find(p => p.name === propertyName) as T | undefined;

    if (!property) {
      return Result.fail(new PropertyNotFoundError(propertyName));
    }

    return Result.ok(property);
  }

  getPropertiesByType(type: PropertyType) {
    return this.properties.filter(p => p.type === type);
  }

  getRelationshipProperties(): V1RelationshipProperty[] {
    return this.properties.filter((p): p is V1RelationshipProperty => p.type === 'relationship');
  }

  setAsDefault(currentDefault?: Template) {
    if (currentDefault && !currentDefault.isDefault) {
      throw new DefaultTemplateConflictError(
        `The provided template (ID: ${currentDefault.id}) is not the current default.`
      );
    }

    if (this.isDefault) {
      throw new DefaultTemplateConflictError(`Template (ID: ${this.id}) is already the default.`);
    }

    if (currentDefault) {
      currentDefault.isDefault = false;
    }

    this.isDefault = true;
  }

  onTemplateDeleted(template: Template) {
    const properties = this.properties.filter(p => {
      if (p instanceof V1RelationshipProperty) {
        return p.content !== template.id;
      }

      return true;
    });

    return this.clone({ properties });
  }

  createPropertyAssignment(name: string, input: CreatePropertyAssignmentInput) {
    const property = this.allProperties.find(p => p.name === name);
    if (!property) {
      throw new Error(`Property with name ${name} not found in template ${JSON.stringify(this)}`);
    }

    return property.createPropertyAssignment(input);
  }

  createDefaultPropertyAssignments(): Record<string, PropertyAssignment> {
    const propertyValues = this.allProperties.map(prop => {
      const propertyValue = prop.createDefaultValue();

      return [propertyValue.name, propertyValue];
    });

    return Object.fromEntries(propertyValues);
  }

  update(props: CloneProps): Template {
    if (this.processing?.active) {
      throw new ValidationError([
        { path: 'processing', message: 'template is being processed you can not update it yet' },
      ]);
    }

    const updated = this.clone(props);

    this.checkForConflictingPropertyNames(updated);

    return updated;
  }

  private clone(props: CloneProps) {
    const template = new Template(
      this.id,
      props.name || this.name,
      props.properties || this.properties,
      props.commonProperties || this.commonProperties,
      props.color || this.color,
      props.default ?? this.isDefault,
      props.entityViewPage || this.entityViewPage
    );

    template.processing = this.processing;

    return template;
  }
}

export { Template };
