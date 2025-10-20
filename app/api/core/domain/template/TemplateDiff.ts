import { Template } from 'api/core/domain/template/Template';
import { Property, PropertyUpdateInfo } from 'api/core/domain/template/Property';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { GenerateIdProperty } from './GenerateIdProperty';

type RenamedMap = { [oldName: string]: string };

class TemplateDiff {
  readonly oldTemplate: Template;

  readonly newTemplate: Template;

  private _newProperties?: Property[];

  private _deletedProperties?: Property[];

  private _updatedProperties?: PropertyUpdateInfo[];

  private _renamedProperties?: RenamedMap;

  private _relationshipPropsWithRelationshipChanges?: V1RelationshipProperty[];

  private _newRelationshipProps?: V1RelationshipProperty[];

  private _newGeneratedIdProps?: GenerateIdProperty[];

  constructor(oldTemplate: Template, newTemplate: Template) {
    this.oldTemplate = oldTemplate;
    this.newTemplate = newTemplate;
  }

  get templateId() {
    return this.oldTemplate.id;
  }

  get newProperties() {
    if (this._newProperties === undefined) {
      const oldIdSet = new Set(this.oldTemplate.properties.map(p => p.id));
      this._newProperties = this.newTemplate.properties.filter(p => !oldIdSet.has(p.id));
    }
    return this._newProperties;
  }

  get deletedProperties() {
    if (this._deletedProperties === undefined) {
      const newIdSet = new Set(this.newTemplate.properties.map(p => p.id));
      this._deletedProperties = this.oldTemplate.properties.filter(p => !newIdSet.has(p.id));
    }
    return this._deletedProperties;
  }

  get updatedProperties() {
    if (this._updatedProperties === undefined) {
      this._updatedProperties = this.oldTemplate.selectUpdatedProperties(this.newTemplate);
    }
    return this._updatedProperties;
  }

  get renamedProperties() {
    if (this._renamedProperties === undefined) {
      const map: RenamedMap = {};
      this.updatedProperties
        .filter(u => u.updatedAttributes.includes('name'))
        .forEach(u => {
          const oldProp = this.oldTemplate.getPropertyById(u.id);
          const newProp = this.newTemplate.getPropertyById(u.id);
          if (oldProp && newProp) map[oldProp.name] = newProp.name;
        });
      this._renamedProperties = map;
    }

    return this._renamedProperties;
  }

  get relationshipPropsWithRelationshipChanges() {
    if (this._relationshipPropsWithRelationshipChanges === undefined) {
      this._relationshipPropsWithRelationshipChanges =
        this.oldTemplate.selectRelationshipPropsWithRelationshipChanges(this.newTemplate);
    }

    return this._relationshipPropsWithRelationshipChanges;
  }

  get newRelationshipProps() {
    if (this._newRelationshipProps === undefined) {
      this._newRelationshipProps = this.newProperties.filter(
        (p): p is V1RelationshipProperty => p.type === 'relationship'
      );
    }

    return this._newRelationshipProps;
  }

  get newGeneratedIdProps() {
    if (this._newGeneratedIdProps === undefined) {
      this._newGeneratedIdProps = this.newProperties.filter(
        (p): p is GenerateIdProperty => p.type === 'generatedid'
      );
    }

    return this._newGeneratedIdProps;
  }

  get deletedPropertyNames() {
    return this.deletedProperties.map(p => p.name);
  }

  get modifiedRelationshipPropIds() {
    const concat = (this.relationshipPropsWithRelationshipChanges || []).concat(
      this.newRelationshipProps || []
    );
    return concat.map(p => p.id);
  }

  get newGeneratedIdPropIds() {
    return (this.newGeneratedIdProps || []).map(p => p.id);
  }

  hasAnyPostProcessChanges() {
    return (
      this.relationshipPropsWithRelationshipChanges.length > 0 ||
      this.newRelationshipProps.length > 0 ||
      this.newGeneratedIdProps.length > 0 ||
      Object.keys(this.renamedProperties).length > 0 ||
      this.deletedProperties.length > 0
    );
  }
}
export { TemplateDiff };
