import { TemplateBuilder } from './TemplateBuilder.js';
import { SelectProperty } from '../select/SelectProperty.js';
import { MultiSelectProperty } from '../select/MultiSelectProperty.js';

describe('Select/MultiSelect duplicate removal', () => {
  const buildTemplate = () =>
    TemplateBuilder.aTemplate({ id: 'template-select' })
      .withProperties([
        new SelectProperty({
          id: 'prop-select',
          template: 'template-select',
          label: 'select',
          content: 'thes-id',
        }),
        new MultiSelectProperty({
          id: 'prop-multi',
          template: 'template-select',
          label: 'multiselect',
          content: 'thes-id',
        }),
      ])
      .build();

  it('should remove duplicate values in multiselect', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('multiselect', {
      language: 'en',
      value: [
        { value: 'banana', label: 'Banana' },
        { value: 'banana', label: 'Banana duplicate' },
        { value: 'orange', label: 'Orange' },
        { value: 'orange', label: 'Orange duplicate' },
      ],
    });

    expect(assignment.name).toBe('multiselect');
    expect(assignment.type).toBe('multiselect');
    expect(assignment.value).toEqual([
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ]);
  });

  it('should dedupe select input before cardinality enforcement', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('select', {
      language: 'en',
      value: [
        { value: 'apple', label: 'Apple' },
        { value: 'apple', label: 'Apple duplicate' },
      ],
    });

    expect(assignment.name).toBe('select');
    expect(assignment.type).toBe('select');
    // After dedupe there will be only one entry and schema enforces max 1
    expect(assignment.value).toEqual([{ value: 'apple', label: 'Apple' }]);
  });

  it('should filter out empty and whitespace-only values', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('select', {
      language: 'en',
      value: [
        { value: '', label: 'Empty' },
        { value: '   ', label: 'Whitespace' },
        { value: 'apple', label: 'Apple' },
      ],
    });

    expect(assignment.value).toEqual([{ value: 'apple', label: 'Apple' }]);
  });

  it('should handle null and undefined values', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('select', {
      language: 'en',
      value: [
        { value: null as any, label: 'Null' },
        { value: undefined as any, label: 'Undefined' },
        { value: 'apple', label: 'Apple' },
      ],
    });

    expect(assignment.value).toEqual([{ value: 'apple', label: 'Apple' }]);
  });

  it('should return empty array when all values are empty/whitespace', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('select', {
      language: 'en',
      value: [
        { value: '', label: 'Empty' },
        { value: '   ', label: 'Whitespace' },
      ],
    });

    expect(assignment.value).toEqual([]);
  });

  it('should filter out empty values in multiselect', () => {
    const template = buildTemplate();

    const assignment = template.createPropertyAssignment('multiselect', {
      language: 'en',
      value: [
        { value: '', label: 'Empty' },
        { value: 'apple', label: 'Apple' },
        { value: '   ', label: 'Whitespace' },
        { value: 'banana', label: 'Banana' },
      ],
    });

    expect(assignment.value).toEqual([
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ]);
  });
});
