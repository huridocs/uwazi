import { IDGenerator } from 'shared/IDGenerator';
import { unique } from 'api/utils/filters';

describe('IDGenerator', () => {
  describe('generateId', () => {
    const generateAssertedID = (characterLength = 2, numericLength = 4, extraLength = 0) => {
      const generatedId = IDGenerator.generateID(characterLength, numericLength, extraLength);
      expect(generatedId.length).toBe(characterLength + numericLength + Math.min(extraLength, 13));
      const characterPart = generatedId.substr(0, characterLength);
      const numericPart = generatedId.substr(characterLength, numericLength);
      expect(parseFloat(characterPart)).toBe(NaN);
      if (numericLength) expect(parseFloat(numericPart)).toBeGreaterThan(-1);
      return generatedId;
    };

    it.each`
      letters | numbers
      ${2}    | ${4}
      ${0}    | ${6}
      ${7}    | ${0}
    `(
      'should generate a random ID with the number of $letters letters, $numbers numbers specified',
      ({ letters, numbers }) => {
        generateAssertedID(letters, numbers);
      }
    );

    it.each`
      letters | numbers | extra
      ${2}    | ${4}    | ${3}
      ${2}    | ${4}    | ${0}
      ${2}    | ${4}    | ${5}
    `(
      'should generate a random ID with the number of $letters letters, $numbers numbers, $extra extra specified',
      ({ letters, numbers, extra }) => {
        generateAssertedID(letters, numbers, extra);
      }
    );

    it.each`
      letters | numbers | extra | output
      ${-2}   | ${4}    | ${2}  | ${6}
      ${2}    | ${-4}   | ${2}  | ${4}
      ${2}    | ${3}    | ${-4} | ${5}
      ${2}    | ${3}    | ${20} | ${18}
      ${30}   | ${4}    | ${2}  | ${19}
      ${30}   | ${40}   | ${20} | ${39}
    `(
      'should generate a random ID even with lengths outside 0..13',
      ({ letters, numbers, extra, output }) => {
        const generatedId = IDGenerator.generateID(letters, numbers, extra);
        expect(generatedId.length).toBe(output);
      }
    );

    it('should generate different IDs at each call', () => {
      const generatedIDs = [...Array(100)].map((_, _i) => generateAssertedID(3, 4, 5));
      expect(generatedIDs.length).toBe(100);
      const uniqueGeneratedIDs = generatedIDs.filter(unique);
      expect(uniqueGeneratedIDs.length).toBe(generatedIDs.length);
    });
  });
});
