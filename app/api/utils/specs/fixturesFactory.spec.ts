import { getIdMapper, getFixturesFactory } from '../fixturesFactory';

describe('getIdMapper', () => {
  it('should create a new id', () => {
    const ids = getIdMapper();

    expect(ids('key')).toBeDefined();
  });

  it('should create a different ids', () => {
    const ids = getIdMapper();

    expect(ids('key1')).not.toEqual(ids('key2'));
  });

  it('should cache ids', () => {
    const ids = getIdMapper();

    expect(ids('key')).toEqual(ids('key'));
  });
});

describe('getFixturesFactory', () => {
  it('should return different instances', () => {
    expect(getFixturesFactory()).not.toBe(getFixturesFactory);
  });

  it('should map the ids correctly encapsulated in the instance', () => {
    const factory1 = getFixturesFactory();
    const factory2 = getFixturesFactory();

    expect(factory1.id('some')).toBe(factory1.id('some'));
    expect(factory1.id('some')).not.toBe(factory2.id('some'));
  });
});
