import { Sets } from '../sets';

describe('Sets', () => {
  describe('constructor', () => {
    it('should initialize as empty', () => {
      const setManager = new Sets();
      expect(setManager.sets).toEqual({});
    });

    it('should initialize with the given values', () => {
      const setManager = new Sets({ key1: ['value1', 'value2'], key2: ['value3'], key3: [] });
      expect(setManager.sets).toEqual({
        key1: new Set(['value1', 'value2']),
        key2: new Set(['value3']),
        key3: new Set(),
      });
    });
  });

  describe('add', () => {
    it('should add an empty set to the object with the first value as index', () => {
      const setManager = new Sets();
      setManager.add('key1');
      expect(setManager.sets).toEqual({ key1: new Set() });
    });

    it('should not overwrite an existing set when called with one value', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1');
      expect(setManager.sets).toEqual({ key1: new Set(['value1']) });
    });

    it("should add the second value to the set indexed by the first value and create it first if it doesn't exist", () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.sets).toEqual({
        key1: new Set(['value1', 'value2']),
        key2: new Set(['value3']),
      });
    });

    it('should return a set from the object', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');

      const set = setManager.set('key1');
      expect(set).toEqual(new Set(['value1', 'value2']));
    });

    it('should report whether the additions were new or not', () => {
      const setManager = new Sets();
      const added1 = setManager.add('key1', 'value1');
      const added2 = setManager.add('key1', 'value2');
      const added3 = setManager.add('key1', 'value2');
      const added4 = setManager.add('key2');

      expect(added1).toEqual({
        indexWasNew: true,
        valueWasNew: true,
      });
      expect(added2).toEqual({
        indexWasNew: false,
        valueWasNew: true,
      });
      expect(added3).toEqual({
        indexWasNew: false,
        valueWasNew: false,
      });
      expect(added4).toEqual({
        indexWasNew: true,
        valueWasNew: false,
      });
    });
  });

  describe('set', () => {
    it('should return undefined for a non-existing key', () => {
      const setManager = new Sets();
      const set = setManager.set('nonExistingKey');
      expect(set).toBeUndefined();
    });
  });

  describe('sets', () => {
    it('should return the object', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.sets).toEqual({
        key1: new Set(['value1', 'value2']),
        key2: new Set(['value3']),
      });
    });
  });

  describe('has', () => {
    it('should return true if the set contains the value', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.has('key1', 'value1')).toBe(true);
    });

    it('should return false if the set does not contain the value', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.has('key1', 'value3')).toBe(false);
    });

    it('should return false if the set does not exist', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.has('key3', 'value3')).toBe(false);
    });

    it('should be able to test for a set with a single value input', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.has('key1')).toBe(true);
      expect(setManager.has('notakey')).toBe(false);
    });
  });

  describe('size', () => {
    it('without arguments should return the sum size of the sets', () => {
      const setManager = new Sets();

      expect(setManager.size()).toBe(0);

      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.size()).toBe(3);
    });

    it('with a key argument should return the size of the set indexed by the key', () => {
      const setManager = new Sets();
      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');
      setManager.add('key3');

      expect(setManager.size('key1')).toBe(2);
      expect(setManager.size('key2')).toBe(1);
      expect(setManager.size('key3')).toBe(0);
      expect(setManager.size('notakey')).toBe(undefined);
    });
  });

  describe('setCount', () => {
    it('should return the number of sets', () => {
      const setManager = new Sets();

      expect(setManager.setCount()).toBe(0);

      setManager.add('key1', 'value1');
      setManager.add('key1', 'value2');
      setManager.add('key2', 'value3');

      expect(setManager.setCount()).toBe(2);
    });
  });
});
