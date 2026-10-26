import {
  buildEditEntityDefaultValues,
  mapTemplateProperty,
  titleForGeneratedIdTemplate,
  type EditEntityTemplate,
} from '../buildEditEntityDefaultValues.js';

const mockGenerateID = jest.fn(
  (_characterLength: number, _numericLength: number, _extraLength: number) => 'GEN-ID'
);

jest.mock('#shared/IDGenerator', () => ({
  generateID: (characterLength: number, numericLength: number, extraLength: number) =>
    mockGenerateID(characterLength, numericLength, extraLength),
}));

describe('titleForGeneratedIdTemplate', () => {
  beforeEach(() => {
    mockGenerateID.mockClear();
  });

  it('fills an empty title when the title property has generatedId', () => {
    expect(titleForGeneratedIdTemplate('', [{ name: 'title', generatedId: true }])).toBe('GEN-ID');
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
    expect(titleForGeneratedIdTemplate('Stored', [{ name: 'title', generatedId: true }])).toBe(
      'Stored'
    );
    expect(titleForGeneratedIdTemplate('', [{ name: 'title' }])).toBe('');
    expect(titleForGeneratedIdTemplate('', [{ name: 'title', generatedId: false }])).toBe('');
    expect(titleForGeneratedIdTemplate('', undefined)).toBe('');
    expect(mockGenerateID).toHaveBeenCalledTimes(1);
  });
});

const generatedIdTemplate = (): EditEntityTemplate => ({
  _id: 't1',
  commonProperties: [{ name: 'title', generatedId: false }],
  properties: [{ _id: 'p1', name: 'generatedid', type: 'generatedid', label: 'Generatedid' }],
});

const blankGeneratedIdEntity = () => ({
  _id: '',
  sharedId: '',
  title: '',
  template: 't1',
  language: 'en',
  creationDate: 0,
  user: '',
});

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
    expect(values.translations).toEqual({});
    expect(values.touchedTranslations).toEqual({});
  });

  it('returns empty defaults when entity is missing', () => {
    const values = buildEditEntityDefaultValues(undefined, []);
    expect(values).toEqual({
      title: '',
      template: '',
      showIcon: false,
      icon: { _id: null, type: 'Empty', label: '' },
      metadata: {},
      translations: {},
      touchedTranslations: {},
    });
  });

  it('fills an empty title from the selected template generated id', () => {
    const values = buildEditEntityDefaultValues(blankGeneratedIdEntity(), [
      { _id: 't1', commonProperties: [{ name: 'title', generatedId: true }], properties: [] },
    ]);
    expect(values.title).toBe('GEN-ID');
  });

  it('uses the first template when creating without an entity', () => {
    const values = buildEditEntityDefaultValues(undefined, [
      {
        _id: 't1',
        properties: [{ _id: 'p1', name: 'text_prop', type: 'text', label: 'Text' }],
      },
    ]);
    expect(values.template).toBe('t1');
    expect(values.metadata.text_prop).toEqual([]);
    expect(values.translations).toEqual({});
  });

  it('fills an empty generatedid property', () => {
    mockGenerateID.mockClear();
    const created = buildEditEntityDefaultValues(blankGeneratedIdEntity(), [generatedIdTemplate()]);
    expect(created.title).toBe('');
    expect(created.metadata.generatedid).toEqual([{ value: 'GEN-ID' }]);
    expect(mockGenerateID).toHaveBeenCalledTimes(1);
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
  });

  it('keeps a stored generatedid without calling generateID', () => {
    mockGenerateID.mockClear();
    const stored = buildEditEntityDefaultValues(
      { ...blankGeneratedIdEntity(), metadata: { generatedid: [{ value: 'YDZ2036-9005' }] } },
      [generatedIdTemplate()]
    );
    expect(stored.title).toBe('');
    expect(stored.metadata.generatedid).toEqual([{ value: 'YDZ2036-9005' }]);
    expect(mockGenerateID).not.toHaveBeenCalled();
  });
});
