import {
  validate,
  validateDuplicatedLabel,
  validateDuplicatedRelationship,
} from '../ValidateTemplate';

describe('ValidateTemplate', () => {
  let template;
  describe('validateDuplicatedLabel', () => {
    beforeEach(() => {
      template = {
        commonProperties: [{ _id: 't', localID: 'title', name: 'title', label: 'Title' }],
        properties: [
          { _id: '1', localID: 'local0', label: 'Label1' },
          { localID: 'local1', label: 'Label2 ' },
        ],
      };
    });

    it('should return false if prop has same label', () => {
      let prop = { label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, template)).toBe(false);
      prop = { _id: '2', label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, template)).toBe(false);
    });

    it('should return true if same prop', () => {
      const prop = { _id: '1', label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, template)).toBe(true);
    });

    describe('when prop label is same as title', () => {
      it('should return false if prop is not title', () => {
        const prop = { _id: '2', label: 'Title' };
        expect(validateDuplicatedLabel(prop, template)).toBe(false);
      });
      it('should return true if prop is', () => {
        const prop = { _id: 't', label: 'Title' };
        expect(validateDuplicatedLabel(prop, template)).toBe(true);
      });
    });

    describe('when prop is a new property', () => {
      it('should return false on repeated label', () => {
        const prop = { label: 'label2' };
        expect(validateDuplicatedLabel(prop, template)).toBe(false);
      });

      it('should return true when its the same property', () => {
        const prop = { localID: 'local1', label: 'label2' };
        expect(validateDuplicatedLabel(prop, template)).toBe(true);
      });
    });
  });
  describe('validate duplicated relationship', () => {
    beforeEach(() => {
      template = [
        {
          localID: 'local0',
          label: 'Label0',
          type: 'relationship',
          relationType: '1',
          content: '1',
        },
      ];
    });

    it('should allow 2 relationships that have same type same content', () => {
      const prop = {
        localID: 'local1',
        label: 'Label1',
        type: 'relationship',
        relationType: '1',
        content: '1',
      };
      template.push(prop);
      expect(validateDuplicatedRelationship(prop, template)).toBe(true);
    });

    it('should not allow 2 relationships with same relationType and one with any template configured', () => {
      const prop = {
        localID: 'local1',
        label: 'Label1',
        type: 'relationship',
        relationType: '1',
        content: '',
      };
      template.push(prop);
      expect(validateDuplicatedRelationship(prop, template)).toBe(false);
    });

    it('should allow 2 relationships with diferent relationType configured', () => {
      const prop = {
        localID: 'local1',
        label: 'Label1',
        type: 'relationship',
        relationType: '2',
        content: '1',
      };
      template.push(prop);
      expect(validateDuplicatedRelationship(prop, template)).toBe(true);
    });

    it('should allow 2 relationships with same relationType  but different content configured', () => {
      const prop = {
        localID: 'local1',
        label: 'Label1',
        type: 'relationship',
        relationType: '1',
        content: '2',
      };
      template.push(prop);
      expect(validateDuplicatedRelationship(prop, template)).toBe(true);
    });

    it('should allow new added relationship properties', () => {
      template = [
        { localID: 'local0', label: 'Label1', type: 'text' },
        {
          localID: 'local1',
          label: 'Label0',
          type: 'relationship',
          relationType: '1',
          content: '1',
        },
      ];
      const prop = { localID: 'local2', label: 'Label1', type: 'relationship' };
      template.push(prop);
      expect(validateDuplicatedRelationship(prop, template)).toBe(true);
    });
  });

  describe('validator', () => {
    let templates;
    let properties;
    let commonProperties;
    let id;
    let validator;

    beforeEach(() => {
      id = 'tpl';
      templates = [];
      properties = [];
      commonProperties = [
        { localID: 't', name: 'title', label: 'Title' },
        { localID: 'cd', name: 'creationDate', label: 'Date added' },
      ];
      template = {
        commonProperties: [
          { localID: 't', name: 'title', label: 'Title' },
          { localID: 'cd', name: 'creationDate', label: 'Date added' },
        ],
        properties: [{ localID: '1', name: 'f1', label: 'F1' }],
        id,
      };
    });

    const makeValidator = () => {
      validator = validate(properties, commonProperties, templates, id);
      return validator;
    };

    describe('title field', () => {
      function validateTitleLabel(rule) {
        return validator[''][`commonProperties.0.label.${rule}`](template);
      }
      it('should validate label required rule', () => {
        makeValidator();
        template.commonProperties[0].label = '';
        expect(validateTitleLabel('required')).toBeFalsy();
        template.commonProperties[0].label = '  ';
        expect(validateTitleLabel('required')).toBeFalsy();
        template.commonProperties[0].label = 'Name';
        expect(validateTitleLabel('required')).toBeTruthy();
      });

      it('should validate label duplicated rule', () => {
        makeValidator();
        expect(validateTitleLabel('duplicated')).toBeTruthy();
        template.properties[0].label = 'Title';
        expect(validateTitleLabel('duplicated')).toBeFalsy();
      });
    });
  });

  describe('selects and multiselects', () => {
    let properties = [];
    let validator;
    let templates;

    const _id = 'templateId';
    const commonProperties = [
      { localID: 't', name: 'title', label: 'Title' },
      { localID: 'cd', name: 'creationDate', label: 'Date added' },
    ];
    const templateToValidate = {
      _id,
      commonProperties,
      properties,
    };

    const validation = () => {
      templateToValidate.properties = properties;
      templates = [templateToValidate];
      return validate(properties, commonProperties, templates, _id);
    };

    it('should validate the select has valid content', () => {
      properties = [{ _id: '1', label: 'My select', type: 'select', content: '1' }];
      validator = validation();
      expect(validator['']['properties.0.content.required'](templateToValidate)).toBeTruthy();
    });

    it('should validate the content is not empty', () => {
      properties = [{ _id: '1', label: 'My select', type: 'select', content: '' }];
      validator = validation();
      expect(validator['']['properties.0.content.required'](templateToValidate)).not.toBeTruthy();
    });
  });
});
