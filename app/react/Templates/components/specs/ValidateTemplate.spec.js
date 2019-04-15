import { validateDuplicatedLabel, validateDuplicatedRelationship } from '../ValidateTemplate';

describe('ValidateTemplate', () => {
  let properties;
  describe('validateDuplicatedLabel', () => {
    beforeEach(() => {
      properties = [
        { _id: '1', localID: 'local0', label: 'Label1' },
        { localID: 'local1', label: 'Label2 ' }
      ];
    });

    it('should return false if prop has same label', () => {
      let prop = { label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, properties)).toBe(false);
      prop = { _id: '2', label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, properties)).toBe(false);
    });

    it('should return true if same prop', () => {
      const prop = { _id: '1', label: 'label1 ' };
      expect(validateDuplicatedLabel(prop, properties)).toBe(true);
    });

    describe('when prop is a new property', () => {
      it('should return false on repeated label', () => {
        const prop = { label: 'label2' };
        expect(validateDuplicatedLabel(prop, properties)).toBe(false);
      });

      it('should return true when its the same property', () => {
        const prop = { localID: 'local1', label: 'label2' };
        expect(validateDuplicatedLabel(prop, properties)).toBe(true);
      });
    });
  });
  describe('validate duplicated relationship', () => {
    beforeEach(() => {
      properties = [
        { localID: 'local0', label: 'Label0', type: 'relationship', relationType: '1', content: '1' },
      ];
    });

    it('should not allow 2 relationships that are equaly configured', () => {
      const prop = { localID: 'local1', label: 'Label1', type: 'relationship', relationType: '1', content: '1' };
      properties.push(prop);
      expect(validateDuplicatedRelationship(prop, properties)).toBe(false);
    });

    it('should not allow 2 relationships with same relationType and one with any template configured', () => {
      const prop = { localID: 'local1', label: 'Label1', type: 'relationship', relationType: '1', content: '' };
      properties.push(prop);
      expect(validateDuplicatedRelationship(prop, properties)).toBe(false);
    });

    it('should allow 2 relationships with diferent relationType configured', () => {
      const prop = { localID: 'local1', label: 'Label1', type: 'relationship', relationType: '2', content: '1' };
      properties.push(prop);
      expect(validateDuplicatedRelationship(prop, properties)).toBe(true);
    });

    it('should allow 2 relationships with same relationType  but different content configured', () => {
      const prop = { localID: 'local1', label: 'Label1', type: 'relationship', relationType: '1', content: '2' };
      properties.push(prop);
      expect(validateDuplicatedRelationship(prop, properties)).toBe(true);
    });

    it('should allow new added relationship properties', () => {
      properties = [
        { localID: 'local0', label: 'Label1', type: 'text' },
        { localID: 'local1', label: 'Label0', type: 'relationship', relationType: '1', content: '1' }
      ];
      const prop = { localID: 'local2', label: 'Label1', type: 'relationship' };
      properties.push(prop);
      expect(validateDuplicatedRelationship(prop, properties)).toBe(true);
    });
  });
});
