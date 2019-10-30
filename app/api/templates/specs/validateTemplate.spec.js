import { validateTemplate } from '../templateSchema';

describe('validateTemplate', () => {
  let template;

  const makeProperty = (name, type, isCommonProperty = false, prioritySorting = false) => ({
    name,
    type,
    id: name,
    label: name,
    isCommonProperty,
    prioritySorting
  });

  beforeEach(() => {
    template = {
      name: 'Test',
      commonProperties: [
        makeProperty('title', 'text', true),
        makeProperty('creationDate', 'date')
      ],
      properties: [
        makeProperty('title', 'select')
      ]
    };
  });

  const testValid = () => {
    const valid = validateTemplate(template);
    expect(valid).toBe(true);
  }

  const testInvalid = () => expect(validateTemplate(template)).toBe(false);

  describe('valid cases', () => {
    it('should return true if the template is valid', () => {
      testValid();
    });
    it('should return true if property array is empty', () => {
      template.properties = [];
      testValid();
    });
  });

  describe('invalid cases', () => {
    it('invalid if commonProperties is empty', () => {
      template.commonProperties = [];
      testInvalid();
    });

    it('invalid when property has unknown data type', () => {
      template.properties[0].type = 'unknown';
      testInvalid();
    })
  });
});
