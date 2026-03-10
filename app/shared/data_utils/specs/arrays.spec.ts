import { Arrays } from '../arrays';

describe('arrays', () => {
  describe('constructor', () => {
    it('should initialize as empty', () => {
      const arr = new Arrays();
      expect(arr.arr).toEqual({});
    });

    it('should initialize with the given values', () => {
      const input = {
        key1: ['value1', 'value2'],
        key2: ['value3'],
        key3: [],
      };
      const arr = new Arrays(input);
      expect(arr.arr).toEqual(input);
    });
  });

  describe('push', () => {
    it('should push a value to new array', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      expect(arr.arr).toEqual({ key1: ['value1'] });
    });

    it('should push a value to an existing array', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      expect(arr.arr).toEqual({ key1: ['value1', 'value2'] });
    });
  });

  describe('get', () => {
    it('with one value, it should return the array', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      expect(arr.get('key1')).toEqual(['value1', 'value2']);
      expect(arr.get('notAKey')).toBeUndefined();
    });

    it('with two values, it should return the value', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      expect(arr.get('key1', 1)).toEqual('value2');
      expect(arr.get('key1', 99)).toBeUndefined();
    });
  });

  describe('set', () => {
    it('with one value, it should set an empty array int the object', () => {
      const arr = new Arrays();
      arr.set('key1');
      expect(arr.arr).toEqual({ key1: [] });
    });

    it('with two values, it should throw an error', () => {
      const arr = new Arrays();
      // @ts-expect-error
      const callback = () => arr.set('key1', 'value1');
      expect(callback).toThrowError(
        'Needs one parameter for the key, or three parameters for the key, index, and value.'
      );
    });

    it('with three values, it should put the value in the correct place', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      expect(arr.arr).toEqual({ key1: ['value1', 'value2'] });
      arr.set('key1', 1, 'changedValue');
      expect(arr.arr).toEqual({ key1: ['value1', 'changedValue'] });
      arr.set('key1', 2, 'value3');
      expect(arr.arr).toEqual({ key1: ['value1', 'changedValue', 'value3'] });
    });
  });

  describe('size', () => {
    it('with one value, it should return the length of the array', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      expect(arr.size('key1')).toEqual(2);
      expect(arr.size('notAKey')).toBeUndefined();
    });

    it('with no value, it should return the sum of the lengths of all arrays', () => {
      const arr = new Arrays();
      expect(arr.size()).toEqual(0);
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      arr.push('key2', 'value3');
      expect(arr.size()).toEqual(3);
    });
  });

  describe('arrayCount', () => {
    it('should return the number of arrays in the object', () => {
      const arr = new Arrays();
      arr.push('key1', 'value1');
      arr.push('key1', 'value2');
      arr.push('key2', 'value3');
      expect(arr.arrayCount()).toEqual(2);
    });
  });
});
