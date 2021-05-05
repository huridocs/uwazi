import { unique } from 'api/utils/filters';
import { generateID } from 'shared/IDGenerator';

describe('IDGenerator', () => {
  describe('generateId', () => {
    const generateAssertedID = (characterLength = 2, numericLength = 4, extraLength = 0) => {
      const generatedId = generateID(characterLength, numericLength, extraLength);
      const extraExpectedLength = extraLength > 0 ? Math.min(extraLength, 13) + 1 : 0;
      expect(generatedId.length).toBe(characterLength + numericLength + extraExpectedLength);
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
      ${-2}   | ${4}    | ${2}  | ${7}
      ${2}    | ${-4}   | ${2}  | ${5}
      ${2}    | ${3}    | ${-4} | ${5}
      ${2}    | ${3}    | ${20} | ${19}
      ${30}   | ${4}    | ${2}  | ${20}
      ${30}   | ${40}   | ${20} | ${40}
    `(
      'should generate a random ID even with lengths outside 0..13',
      ({ letters, numbers, extra, output }) => {
        const generatedId = generateID(letters, numbers, extra);
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
