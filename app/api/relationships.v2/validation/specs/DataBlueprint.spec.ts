import ValidationError from 'ajv/dist/runtime/validation_error';
import { DataBlueprint } from '../dataBlueprint';

const subSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    subString: { type: 'string', minLength: 1 },
    subNumber: { type: 'number' },
  },
};

const foreignSchemaA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    foreignStringA: { type: 'string', minLength: 1 },
    foreignNumberA: { type: 'number' },
  },
  required: ['foreignStringA', 'foreignNumberA'],
};

const foreignSchemaB = {
  type: 'object',
  additionalProperties: false,
  properties: {
    foreignStringB: { type: 'string', minLength: 1 },
    foreignNumberB: { type: 'number' },
  },
  required: ['foreignStringB', 'foreignNumberB'],
};

const testSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'FileType',
  definitions: { subSchema },
  properties: {
    mainString: { type: 'string', minLength: 1 },
    mainNumber: { type: 'number' },
    subValue: subSchema,
    pointerToForeignSchemaA: { type: 'string', minLength: 1 },
    pointerToForeignSchemaB: { type: 'string', minLength: 1 },
  },
  required: [
    'mainString',
    'mainNumber',
    'subValue',
    'pointerToForeignSchemaA',
    'pointerToForeignSchemaB',
  ],
};

const testBlueprint = new DataBlueprint(testSchema, {
  pointerToForeignSchemaA: foreignSchemaA,
  pointerToForeignSchemaB: foreignSchemaB,
});

describe('DataBlueprint', () => {
  describe('validate()', () => {
    it('should validate with the default schema', () => {
      testBlueprint.validate({
        mainString: 'a',
        mainNumber: 1,
        subValue: {
          subString: 'aa',
          subNumber: 11,
        },
        pointerToForeignSchemaA: 'pa',
        pointerToForeignSchemaB: 'pb',
      });
    });

    it('should fail according to the default schema', () => {
      expect(() =>
        testBlueprint.validate({
          mainString: 'a',
          mainNumber: 1,
        })
      ).toThrow(ValidationError);
    });
  });

  describe('resolve()', () => {
    it('should validate resolving one', () => {
      testBlueprint.resolve(['pointerToForeignSchemaA']).validate({
        mainString: 'a',
        mainNumber: 1,
        subValue: {
          subString: 'aa',
          subNumber: 11,
        },
        pointerToForeignSchemaA: {
          foreignStringA: 'fa',
          foreignNumberA: 111,
        },
        pointerToForeignSchemaB: 'pb',
      });
    });

    it('should fail resolving one', () => {
      expect(() => {
        testBlueprint.resolve(['pointerToForeignSchemaA']).validate({
          mainString: 'a',
          mainNumber: 1,
          subValue: {
            subString: 'aa',
            subNumber: 11,
          },
          pointerToForeignSchemaA: {
            foreignStringA: 'fa',
            foreignNumberA: 111,
            extraProperty: 'should_not_exist',
          },
          pointerToForeignSchemaB: 'pb',
        });
      }).toThrow(ValidationError);
    });

    it('should validate resolving two', () => {
      testBlueprint.resolve(['pointerToForeignSchemaA', 'pointerToForeignSchemaB']).validate({
        mainString: 'a',
        mainNumber: 1,
        subValue: {
          subString: 'aa',
          subNumber: 11,
        },
        pointerToForeignSchemaA: {
          foreignStringA: 'fa',
          foreignNumberA: 111,
        },
        pointerToForeignSchemaB: {
          foreignStringB: 'fb',
          foreignNumberB: 222,
        },
      });
    });

    it('should fail resolving two', () => {
      expect(() => {
        testBlueprint.resolve(['pointerToForeignSchemaA', 'pointerToForeignSchemaB']).validate({
          mainString: 'a',
          mainNumber: 1,
          subValue: {
            subString: 'aa',
            subNumber: 11,
          },
          pointerToForeignSchemaA: {
            foreignStringA: 'fa',
            foreignNumberA: 111,
          },
          pointerToForeignSchemaB: {
            foreignStringB: 'fb',
            foreignNumberB: 222,
            extraProperty: 'should_not_exist',
          },
        });
      }).toThrow(ValidationError);
    });
  });
});
