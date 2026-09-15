import {
  copyFromMatchingProperties,
  type CopyFromTemplate,
} from '../copyFromMatchingProperties.js';

const templates: CopyFromTemplate[] = [
  {
    _id: 'template_1',
    properties: [
      { name: 'one', type: 'text', label: 'One' },
      { name: 'two', type: 'text', label: 'Two' },
      { name: 'id', type: 'generatedid', label: 'ID' },
    ],
  },
  {
    _id: 'template_2',
    properties: [
      { name: 'two', type: 'text', label: 'Two' },
      { name: 'three', type: 'text', label: 'Three' },
      { name: 'id', type: 'generatedid', label: 'ID' },
    ],
  },
  {
    _id: 'template_3',
    properties: [
      { name: 'description', type: 'markdown', label: 'Description' },
      { name: 'portrait', type: 'image', label: 'Portrait' },
      { name: 'interview', type: 'media', label: 'Interview' },
    ],
  },
  {
    _id: 'template_4',
    properties: [
      { name: 'country', type: 'select', label: 'Country', content: 'abc1' },
      {
        name: 'friends',
        type: 'relationship',
        label: 'Friends',
        inherit: { property: '234', type: 'text' },
      },
    ],
  },
  {
    _id: 'template_5',
    properties: [
      { name: 'country', type: 'select', label: 'Country', content: 'abc1' },
      { name: 'friends', type: 'relationship', label: 'Friends' },
    ],
  },
];

describe('copyFromMatchingProperties', () => {
  it('returns copyable properties of the same template, excluding generatedid, media and image', () => {
    expect(copyFromMatchingProperties(templates, 'template_1', 'template_1')).toEqual([
      { name: 'one', type: 'text', label: 'One' },
      { name: 'two', type: 'text', label: 'Two' },
    ]);
    expect(copyFromMatchingProperties(templates, 'template_3', 'template_3')).toEqual([
      { name: 'description', type: 'markdown', label: 'Description' },
    ]);
  });

  it('returns only properties shared by both templates', () => {
    expect(copyFromMatchingProperties(templates, 'template_1', 'template_2')).toEqual([
      { name: 'two', type: 'text', label: 'Two' },
    ]);
  });

  it('does not match select or inherit properties that differ in content or inherit', () => {
    expect(copyFromMatchingProperties(templates, 'template_4', 'template_5')).toEqual([
      { name: 'country', type: 'select', label: 'Country' },
    ]);
  });

  it('returns an empty list when a template is missing', () => {
    expect(copyFromMatchingProperties(templates, 'template_1', 'missing')).toEqual([]);
    expect(copyFromMatchingProperties(templates, undefined, 'template_1')).toEqual([]);
  });
});
