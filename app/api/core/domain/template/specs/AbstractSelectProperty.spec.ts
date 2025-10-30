import { TemplateBuilder } from './TemplateBuilder';
import { SelectProperty } from '../select/SelectProperty';
import { MultiSelectProperty } from '../select/MultiSelectProperty';

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
});
