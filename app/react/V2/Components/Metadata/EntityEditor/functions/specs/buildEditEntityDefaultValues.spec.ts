import {
  buildEditEntityDefaultValues,
  mapTemplateProperty,
} from '../buildEditEntityDefaultValues.js';

describe('buildEditEntityDefaultValues', () => {
  it('maps template properties and builds defaults from the entity', () => {
    const mapped = mapTemplateProperty({
      _id: 'p1',
      name: 'text_prop',
      type: 'text',
      label: 'Text',
      required: true,
    });
    expect(mapped).toEqual({
      _id: 'p1',
      type: 'text',
      name: 'text_prop',
      label: 'Text',
      required: true,
      content: undefined,
      relationType: undefined,
      style: undefined,
      inherited: false,
      inheritedType: undefined,
      inherit: undefined,
    });

    const values = buildEditEntityDefaultValues(
      {
        _id: 'e1',
        sharedId: 's1',
        title: 'Title',
        template: 't1',
        language: 'en',
        metadata: { text_prop: [{ value: 'hello' }] },
        creationDate: 0,
        user: 'user1',
      },
      [
        {
          _id: 't1',
          properties: [{ _id: 'p1', name: 'text_prop', type: 'text', label: 'Text' }],
        },
      ]
    );

    expect(values.title).toBe('Title');
    expect(values.template).toBe('t1');
    expect(values.showIcon).toBe(false);
    expect(values.metadata.text_prop).toEqual([{ value: 'hello' }]);
  });

  it('returns empty defaults when entity is missing', () => {
    const values = buildEditEntityDefaultValues(undefined, []);
    expect(values).toEqual({
      title: '',
      template: '',
      showIcon: false,
      icon: { _id: null, type: 'Empty', label: '' },
      metadata: {},
    });
  });
});
