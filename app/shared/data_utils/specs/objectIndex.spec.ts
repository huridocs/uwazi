import { objectIndex } from '../objectIndex';

class Source {
  text: string;

  number: number;

  nested: { value: string };

  constructor(text: string, number: number, nestedValue: string) {
    this.text = text;
    this.number = number;
    this.nested = { value: nestedValue };
  }
}

const sourceArray = [
  new Source('A', 0, 'NA'),
  new Source('B', 0, 'NB'),
  new Source('C', 1, 'NC'),
  new Source('D', 1, 'ND'),
];

describe('objectIndex()', () => {
  it('should index one to one by default, keep the first option on overlap', () => {
    expect(objectIndex(sourceArray, d => d.text, objectIndex.NoTransform)).toEqual({
      A: sourceArray[0],
      B: sourceArray[1],
      C: sourceArray[2],
      D: sourceArray[3],
    });
    expect(objectIndex(sourceArray, d => d.nested.value, objectIndex.NoTransform)).toEqual({
      NA: sourceArray[0],
      NB: sourceArray[1],
      NC: sourceArray[2],
      ND: sourceArray[3],
    });
    expect(objectIndex(sourceArray, d => d.number, objectIndex.NoTransform)).toEqual({
      0: sourceArray[0],
      1: sourceArray[2],
    });
  });

  it('should allow transformation on data', () => {
    expect(
      objectIndex(
        sourceArray,
        d => d.text,
        d => d.nested.value
      )
    ).toEqual({
      A: 'NA',
      B: 'NB',
      C: 'NC',
      D: 'ND',
    });
  });
});
