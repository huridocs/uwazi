import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';

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
});
