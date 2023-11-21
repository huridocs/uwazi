import { explicitOrdering } from '../arrayUtils';

describe('explicitOrdering()', () => {
  it('should arrange elements based on orderArray with strict', () => {
    const orderArray = ['a', 'b', 'c'];
    const inputArray = ['c', 'b', 'a'];

    expect(explicitOrdering(orderArray, inputArray, true)).toEqual(orderArray);
  });

  it('should arrange elements based on orderArray without strict', () => {
    let orderArray = ['a', 'b', 'c'];
    let inputArray = ['c', 'd', 'b', 'a', 'e'];

    expect(explicitOrdering(orderArray, inputArray, false)).toEqual(['a', 'b', 'c', 'd', 'e']);

    orderArray = ['a', 'b', 'c', 'd'];
    inputArray = ['c', 'b', 'a'];

    expect(explicitOrdering(orderArray, inputArray, false)).toEqual(['a', 'b', 'c']);
  });

  it('should throw an error in strict mode for invalid elements', () => {
    let orderArray = ['a', 'b', 'c'];
    let inputArray = ['c', 'd', 'b', 'a', 'e'];

    expect(() => explicitOrdering(orderArray, inputArray, true)).toThrowError(
      'Invalid elements found in ordering - d, e'
    );

    orderArray = ['a', 'b', 'c'];
    inputArray = ['c', 'd', 'a'];

    expect(() => explicitOrdering(orderArray, inputArray, true)).toThrowError(
      'Invalid elements found in ordering - d'
    );
  });
});
