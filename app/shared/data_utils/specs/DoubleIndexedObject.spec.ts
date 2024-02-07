import { DoubleIndexedObject, Values } from '../DoubleIndexedObject';

describe('DoubleIndexedObject', () => {
  describe('constructor', () => {
    it('should initialize as empty', () => {
      const obj = new DoubleIndexedObject();
      expect(obj.obj).toEqual({});
    });

    it('should initialize with the given values', () => {
      const input: Values = {
        1: { 11: '111', 12: '121' },
        2: { 21: '211' },
        3: {},
      };
      const obj = new DoubleIndexedObject(input);
      expect(obj.obj).toEqual({
        1: { 11: '111', 12: '121' },
        2: { 21: '211' },
        3: {},
      });
    });
  });

  describe('set', () => {
    describe('with one value', () => {
      it('should set an empty object to the object with the first value as index', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1');
        expect(obj.obj).toEqual({ 1: {} });
      });

      it('should not overwrite an existing object when called with one value', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1', '11', '111');
        obj.set('1');
        expect(obj.obj).toEqual({ 1: { 11: '111' } });
      });
    });

    describe('with two values', () => {
      it('should throw error', () => {
        const obj = new DoubleIndexedObject();
        // @ts-expect-error
        const setition = () => obj.set('1', '11');
        expect(setition).toThrowError(
          'Needs one index to initialize an empty nested object, or three indices for a full key1-key2-value information.'
        );
      });
    });

    describe('with three values', () => {
      it('should set the second value to the object indexed by the first value and create it first if it doesnt exist', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1', '11', '111');
        obj.set('1', '12', '121');
        obj.set('2', '21', '211');

        expect(obj.obj).toEqual({
          1: { 11: '111', 12: '121' },
          2: { 21: '211' },
        });
      });

      it('should silently overwrite', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1', '11', '111');
        expect(obj.obj).toEqual({ 1: { 11: '111' } });
        obj.set('1', '11', '112');
        expect(obj.obj).toEqual({ 1: { 11: '112' } });
      });
    });
  });

  describe('get', () => {
    describe('with one value', () => {
      it('should return the sub-object', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1');
        expect(obj.get('1')).toEqual({});

        obj.set('2', '21', '211');
        obj.set('2', '22', '221');
        expect(obj.get('2')).toEqual({ 21: '211', 22: '221' });
      });
    });

    describe('with two values', () => {
      it('should return the value', () => {
        const obj = new DoubleIndexedObject();
        obj.set('1', '11', '111');
        obj.set('1', '12', '121');
        obj.set('2', '21', '211');
        obj.set('3');
        expect(obj.get('1', '11')).toEqual('111');
        expect(obj.get('1', '12')).toEqual('121');
        expect(obj.get('2', '21')).toEqual('211');
        expect(obj.get('3', 'notThere')).toEqual(undefined);
      });
    });
  });
});
