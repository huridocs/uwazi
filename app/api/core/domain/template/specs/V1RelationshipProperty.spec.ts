import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { PropertyInheritedTypeMismatchError, PropertyTypeMismatchError } from '../errors';

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

      expect(() => relationship.createPropertyAssignment({ value: [], language: 'en' })).toThrow(
        'Relationship Property is required'
      );
    });
  });
});
