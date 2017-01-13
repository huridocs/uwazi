import {advancedSort} from '../advancedSort';

fdescribe('Advanced Sort', () => {
  it('should sort regular characters (not affecting original)', () => {
    const baseArray = ['z', 'a', 'r', 'f'];

    expect(advancedSort(baseArray)).toEqual(['a', 'f', 'r', 'z']);
    expect(advancedSort(baseArray, {order: 'desc'})).toEqual(['z', 'r', 'f', 'a']);
    expect(baseArray).toEqual(['z', 'a', 'r', 'f']);
  });

  it('should sort lower and upper case characters (not affecting original)', () => {
    const baseArray = ['z', 'A', 'R', 'f'];

    expect(advancedSort(baseArray)).toEqual(['A', 'f', 'R', 'z']);
    expect(baseArray).toEqual(['z', 'A', 'R', 'f']);
  });

  it('should sort special characters (not affecting original)', () => {
    const baseArray = ['z', 'Á', 'é', 'R', 'f'];

    expect(advancedSort(baseArray)).toEqual(['Á', 'é', 'f', 'R', 'z']);
    expect(baseArray).toEqual(['z', 'Á', 'é', 'R', 'f']);
  });

  it('should sort strings of numbers correctly (not affecting original)', () => {
    const baseArray = ['1', '10', '3.1', '3', '200'];

    expect(advancedSort(baseArray, {treatAs: 'number'})).toEqual(['1', '3', '3.1', '10', '200']);
    expect(advancedSort(baseArray, {treatAs: 'number', order: 'desc'})).toEqual(['200', '10', '3.1', '3', '1']);
    expect(baseArray).toEqual(['1', '10', '3.1', '3', '200']);
  });

  describe('Sorting objects', () => {
    let indexA;
    let indexB;
    let indexC;
    let indexD;
    let indexE;

    beforeEach(() => {
      indexA = {a: 'a', b: 'z', c: '10', sub: {a: 'x'}};
      indexB = {a: 'b', b: 'Á', c: '1', sub: {a: 'c'}};
      indexC = {a: 'c', b: 'é', c: '3.1', sub: {a: 'a'}};
      indexD = {a: 'd', b: 'R', c: '900'};
      indexE = {a: 'e', b: 'f', sub: {c: 'b'}};
    });

    it('should allow sorting by a single property (not affecting original)', () => {
      const baseArray = [indexA, indexB, indexC, indexD, indexE];

      expect(advancedSort(baseArray, {property: 'b'})).toEqual([indexB, indexC, indexE, indexD, indexA]);
      expect(baseArray).toEqual([indexA, indexB, indexC, indexD, indexE]);
      expect(advancedSort(baseArray, {property: 'a'})).toEqual([indexA, indexB, indexC, indexD, indexE]);
      expect(baseArray).toEqual([indexA, indexB, indexC, indexD, indexE]);
    });

    it('should place items missing the property at the end', () => {
      delete indexB.b;
      const baseArray = [indexA, indexB, indexC, indexD, indexE];

      expect(advancedSort(baseArray, {property: 'b'})).toEqual([indexC, indexE, indexD, indexA, indexB]);
      expect(advancedSort(baseArray, {property: 'b', order: 'desc'})).toEqual([indexA, indexD, indexE, indexC, indexB]);
      expect(baseArray).toEqual([indexA, indexB, indexC, indexD, indexE]);
    });

    it('should allow number sorting', () => {
      delete indexB.b;
      const baseArray = [indexA, indexB, indexC, indexD, indexE];
      const options = {property: 'c', treatAs: 'number'};
      expect(advancedSort(baseArray, options)).toEqual([indexB, indexC, indexA, indexD, indexE]);

      expect(baseArray).toEqual([indexA, indexB, indexC, indexD, indexE]);
    });

    it('should allow sorting by sub properties', () => {
      const baseArray = [indexA, indexB, indexC, indexD, indexE];
      const options = {property: ['sub', 'a']};
      expect(advancedSort(baseArray, options).slice(0, 3)).toEqual([indexC, indexB, indexA]);
      expect(advancedSort(baseArray, options)[3] === indexD || advancedSort(baseArray, options)[3] === indexE).toBe(true);
      expect(advancedSort(baseArray, options)[4] === indexD || advancedSort(baseArray, options)[4] === indexE).toBe(true);
    });
  });

  describe('Sorting doted list numbers', () => {
    it('should sort list according to parameters passed', () => {
      const list = ['1.1.c', '1.1.a', '0.3', '1.1.b', '1.10', '1.2', '1', '1.2.a', '1.2.b', '3.1', '20.2.a', '1.1', '10.5.c', '2', '10.5.a'];
      const options = {treatAs: 'dottedList', listTypes: [Number, Number, String]};
      const expectedResult = ['0.3', '1', '1.1', '1.1.a', '1.1.b', '1.1.c', '1.2', '1.2.a', '1.2.b', '1.10',
                              '2', '3.1', '10.5.a', '10.5.c', '20.2.a'];
      expect(advancedSort(list, options)).toEqual(expectedResult);
    });

    it('should sort objects with dotted lists', () => {
      const list = [{a: '10'}, {a: '2.1'}];
      const options = {property: 'a', treatAs: 'dottedList', listTypes: [Number, Number, String]};
      expect(advancedSort(list, options)).toEqual([{a: '2.1'}, {a: '10'}]);
    });
  });
});
