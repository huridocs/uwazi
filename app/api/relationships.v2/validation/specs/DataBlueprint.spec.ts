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

const testBlueprint = new DataBlueprint(testSchema);

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

  describe('substitute()', () => {
    const substitutedA = testBlueprint.substitute({ pointerToForeignSchemaA: foreignSchemaA });
    const substitutedAB = testBlueprint.substitute({
      pointerToForeignSchemaA: foreignSchemaA,
      pointerToForeignSchemaB: foreignSchemaB,
    });

    it('should validate after substituting one', () => {
      substitutedA.validate({
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

    it('should fail properly after substituting one', () => {
      expect(() => {
        substitutedA.validate({
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

    it('should validate after substituting two', () => {
      substitutedAB.validate({
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

    it('should fail substituting two', () => {
      expect(() => {
        substitutedAB.validate({
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
