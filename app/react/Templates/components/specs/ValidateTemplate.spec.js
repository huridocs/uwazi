import {validateDuplicatedLabel} from '../ValidateTemplate';

describe('ValidateTemplate', () => {
  describe('validateDuplicatedLabel', () => {
    let properties;

    beforeEach(() => {
      properties = [
        {_id: '1', localID: 'local0', label: 'Label1'},
        {localID: 'local1', label: 'Label2 '}
      ];
    });

    it('should return false if prop has same label', () => {
      let prop = {label: 'label1 '};
      expect(validateDuplicatedLabel(prop, properties)).toBe(false);
      prop = {_id: '2', label: 'label1 '};
      expect(validateDuplicatedLabel(prop, properties)).toBe(false);
    });

    it('should return true if same prop', () => {
      const prop = {_id: '1', label: 'label1 '};
      expect(validateDuplicatedLabel(prop, properties)).toBe(true);
    });

    describe('when prop is a new property', () => {
      it('should return false on repeated label', () => {
        const prop = {label: 'label2'};
        expect(validateDuplicatedLabel(prop, properties)).toBe(false);
      });

      it('should return true when its the same property', () => {
        const prop = {localID: 'local1', label: 'label2'};
        expect(validateDuplicatedLabel(prop, properties)).toBe(true);
      });
    });
  });
});
