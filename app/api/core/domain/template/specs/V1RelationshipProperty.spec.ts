import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import {
  PropertyInheritedTypeMismatchError,
  PropertyRelationTypeMismatchError,
  PropertyTypeMismatchError,
} from '../errors';

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
      _name: {
        value: 'label',
      },
      id: 'id',
      label: 'label',
      relationType: 'relationType',
      type: 'relationship',

      content: undefined,
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

  it('should throw a relation type mismatch error when property relation type are inconsistent', () => {
    const wrongRelationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
      relationType: 'wrong',
    });

    const relationship = V1RelationshipProperty.create({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
      relationType: 'relationType',
    });

    expect(() => relationship.ensurePropertyIsConsistent(wrongRelationship)).toThrow(
      new PropertyRelationTypeMismatchError(relationship, wrongRelationship)
    );

    expect(() => relationship.ensurePropertyIsConsistent(relationship)).not.toThrow();
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
        property: '',
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
        property: '',
      },
    });

    expect(() => relationship.ensurePropertyIsConsistent(wrongRelationship)).toThrow(
      new PropertyInheritedTypeMismatchError(relationship, wrongRelationship)
    );

    expect(() => relationship.ensurePropertyIsConsistent(relationship)).not.toThrow();
  });
});
