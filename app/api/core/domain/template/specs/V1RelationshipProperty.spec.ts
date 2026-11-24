import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import {
  PropertyInheritedTypeMismatchError,
  PropertyRelatedTemplateMismatchError,
  PropertyRelationTypeMismatchError,
  PropertyTypeMismatchError,
} from '../errors.js';
import { TextProperty } from '../TextProperty.js';

describe('V1RelationshipProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = V1RelationshipProperty.create({
      id: 'any',
      label: 'any',
      relationType: 'any',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'relationship',
    });
  });

  it('should set properties correctly', () => {
    expect(
      V1RelationshipProperty.create({
        id: 'id',
        label: 'label',
        relationType: 'relationType',
        template: 'template',
      })
    ).toEqual({
      compatibleTypes: [],
      _name: {
        value: 'label',
      },
      id: 'id',
      label: 'label',
      relationType: 'relationType',
      type: 'relationship',

      content: '',
      inherit: undefined,
      inheritedPropertyId: undefined,

      noLabel: false,
      required: false,
      showInCard: false,
      template: 'template',

      defaultfilter: false,
      filter: false,
      prioritySorting: false,
    });

    expect(
      V1RelationshipProperty.create({
        id: 'id',
        label: 'label',
        relationType: 'relationType',
        template: 'template',
        content: 'content',
        inherit: { property: 'property', type: 'date' },
      })
    ).toEqual({
      compatibleTypes: [],
      _name: {
        value: 'label',
      },
      id: 'id',
      label: 'label',
      relationType: 'relationType',
      type: 'relationship',
      template: 'template',

      content: 'content',
      inherit: { property: 'property', type: 'date' },
      inheritedPropertyId: 'property',

      noLabel: false,
      required: false,
      showInCard: false,

      defaultfilter: false,
      filter: false,
      prioritySorting: false,
    });
  });

  it('should throw a type mismatch error when property types are inconsistent', () => {
    const wrongRelationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      relationType: 'relationType',
    });
    (wrongRelationship as any).type = 'date';

    const relationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      relationType: 'relationType',
    });

    expect(() => relationship.ensurePropertyIsConsistent(wrongRelationship)).toThrow(
      new PropertyTypeMismatchError(relationship, wrongRelationship)
    );
  });

  it('should throw a inherit type mismatch error when property inherit type are inconsistent', () => {
    const wrongRelationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
      relationType: 'relationType',
      inherit: {
        type: 'date',
        property: 'any_wrong',
      },
    });

    const relationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
      relationType: 'relationType',
      inherit: {
        type: 'text',
        property: 'any_wrong',
      },
    });

    expect(() => relationship.ensurePropertyIsConsistent(wrongRelationship)).toThrow(
      new PropertyInheritedTypeMismatchError(relationship, wrongRelationship)
    );

    expect(() => relationship.ensurePropertyIsConsistent(relationship)).not.toThrow();
  });

  describe('ensurePropertyIsConsistent() with a different relationship type or related template', () => {
    const relationship = (overrides: { relationType?: string; content?: string }) =>
      V1RelationshipProperty.create({
        id: '',
        label: 'Mecanismo',
        template: '',
        relationType: 'mechanism',
        content: 'organism',
        ...overrides,
      });

    it('should throw a relationship type mismatch naming the other template', () => {
      const existing = relationship({});
      const attempted = relationship({ relationType: 'related_to' });

      expect(() => existing.ensurePropertyIsConsistent(attempted, 'Sentencia')).toThrow(
        new PropertyRelationTypeMismatchError(existing, attempted, 'Sentencia')
      );
      expect(new PropertyRelationTypeMismatchError(existing, attempted, 'Sentencia').message).toBe(
        '"Mecanismo" uses a different relationship type than the property with the same name in "Sentencia". ' +
          'Properties with the same name must use the same relationship type and related template. ' +
          'Rename this property to save the template.'
      );
    });

    it('should throw a related template mismatch naming the other template', () => {
      const existing = relationship({});
      const attempted = relationship({ content: '' });

      expect(() => existing.ensurePropertyIsConsistent(attempted, 'Sentencia')).toThrow(
        new PropertyRelatedTemplateMismatchError(existing, attempted, 'Sentencia')
      );
      expect(
        new PropertyRelatedTemplateMismatchError(existing, attempted, 'Sentencia').message
      ).toBe(
        '"Mecanismo" links to a different template than the property with the same name in "Sentencia". ' +
          'Properties with the same name must use the same relationship type and related template. ' +
          'Rename this property to save the template.'
      );
    });

    it('should say "another template" when the template name is unknown', () => {
      const existing = relationship({});
      const attempted = relationship({ relationType: 'related_to' });

      expect(() => existing.ensurePropertyIsConsistent(attempted)).toThrow(
        'the property with the same name in another template'
      );
    });

    it('should report the relationship type before the related template', () => {
      const existing = relationship({});
      const attempted = relationship({ relationType: 'related_to', content: '' });

      expect(() => existing.ensurePropertyIsConsistent(attempted, 'Sentencia')).toThrow(
        PropertyRelationTypeMismatchError
      );
    });
  });

  describe('conflictsWith()', () => {
    const build = (inherit?: { type: 'text' | 'date'; property: string }) =>
      V1RelationshipProperty.create({
        id: '',
        label: 'label',
        template: '',
        content: 'content',
        relationType: 'relationType',
        inherit,
      });

    it('should report an inheritType conflict when inherited types differ', () => {
      const relationship = build({ type: 'text', property: 'prop' });
      const other = build({ type: 'date', property: 'prop' });

      expect(relationship.conflictsWith(other)).toEqual(['inheritType']);
    });

    it('should report no conflicts when inherited types match', () => {
      const relationship = build({ type: 'text', property: 'prop' });
      const other = build({ type: 'text', property: 'other_prop' });

      expect(relationship.conflictsWith(other)).toEqual([]);
    });

    it('should report only a type conflict against a same-name non-relationship property', () => {
      const relationship = build({ type: 'text', property: 'prop' });
      const text = new TextProperty({ id: '', label: 'label', template: '' });

      expect(relationship.conflictsWith(text)).toEqual(['type']);
    });

    const relationshipWith = (overrides: { relationType?: string; content?: string }) =>
      V1RelationshipProperty.create({
        id: '',
        label: 'label',
        template: '',
        relationType: 'relationType',
        content: 'content',
        ...overrides,
      });

    it('should report a relationType conflict when relationship types differ', () => {
      const relationship = relationshipWith({ relationType: 'victim_of' });
      const other = relationshipWith({ relationType: 'perpetrator_of' });

      expect(relationship.conflictsWith(other)).toEqual(['relationType']);
    });

    it('should report a content conflict when related templates differ', () => {
      const relationship = relationshipWith({ content: 'cases' });
      const other = relationshipWith({ content: 'hearings' });

      expect(relationship.conflictsWith(other)).toEqual(['content']);
      expect(relationshipWith({ content: '' }).conflictsWith(other)).toEqual(['content']);
    });

    it('should treat a missing related template as any template', () => {
      const relationship = relationshipWith({ content: '' });
      const other = relationshipWith({ content: undefined });

      expect(relationship.conflictsWith(other)).toEqual([]);
    });

    it('should report an inheritType conflict whichever side inherits', () => {
      const inheriting = build({ type: 'text', property: 'prop' });
      const notInheriting = build();

      expect(inheriting.conflictsWith(notInheriting)).toEqual(['inheritType']);
      expect(notInheriting.conflictsWith(inheriting)).toEqual(['inheritType']);
    });

    it('should report every conflict at once', () => {
      const relationship = V1RelationshipProperty.create({
        id: '',
        label: 'label',
        template: '',
        relationType: 'victim_of',
        content: 'cases',
        inherit: { type: 'text', property: 'prop' },
      });
      const other = relationshipWith({ relationType: 'perpetrator_of', content: 'hearings' });

      expect(relationship.conflictsWith(other)).toEqual(['relationType', 'content', 'inheritType']);
    });
  });

  describe('createPropertyAssignment()', () => {
    it('should normalize, trim, and deduplicate values', () => {
      const relationship = V1RelationshipProperty.create({
        id: 'id',
        label: 'label',
        relationType: 'relationType',
        template: 'template',
      });

      const assignment = relationship.createPropertyAssignment({
        value: [
          { value: 'A', label: '', type: 'entity' },
          { value: 'A', label: '', type: 'entity' },
          { value: '', label: 'Label C', type: 'entity' },
          {
            value: 'B',
            label: 'Label B',
            inheritedType: 'text',
            inheritedValue: [{ value: 'valueB' }],
            icon: { id: 'any', label: 'iconB', type: 'img' },
            type: 'entity',
          },
        ],
        language: 'en',
      });

      expect(assignment).toEqual({
        language: 'en',
        name: relationship.name,
        type: relationship.type,
        isTranslatable: false,
        value: [
          {
            value: 'A',
            type: 'entity',
            label: '',
            inheritedValue: undefined,
            inheritedType: undefined,
            icon: undefined,
          },
          {
            value: 'B',
            label: 'Label B',
            inheritedValue: [{ value: 'valueB' }],
            inheritedType: 'text',
            icon: { id: 'any', label: 'iconB', type: 'img' },
            type: 'entity',
          },
        ],
      });
    });

    it('should allow empty value when not required', () => {
      const relationship = V1RelationshipProperty.create({
        id: 'id',
        label: 'label',
        relationType: 'relationType',
        template: 'template',
      });

      const assignment = relationship.createPropertyAssignment({ value: [], language: 'en' });

      expect(assignment).toEqual({
        language: 'en',
        name: relationship.name,
        type: relationship.type,
        isTranslatable: false,
        value: [],
      });
    });

    it('should throw if required and no value is provided', () => {
      const relationship = V1RelationshipProperty.create({
        id: 'id',
        label: 'label',
        relationType: 'relationType',
        template: 'template',
        required: true,
      });

      expect(() =>
        relationship.createPropertyAssignment({ value: [], language: 'en' }, true)
      ).toThrow('Relationship Property is required');
    });
  });
});
