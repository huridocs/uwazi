import objectWithoutKeys from '../objectWithoutKeys';

describe('objectWithoutKeys', () => {
  let source;

  beforeEach(() => {
    source = {a: 'a', b: 'b', c: 'c', z: 'z'};
  });

  it('should return a copy of the object', () => {
    expect(objectWithoutKeys(source)).not.toBe(source);
    expect(objectWithoutKeys(source)).toEqual(source);
  });

  it('should exclude the selected keys, without failing if key not in original object', () => {
    expect(objectWithoutKeys(source, ['b', 'c', 'y'])).toEqual({a: 'a', z: 'z'});
  });
});
