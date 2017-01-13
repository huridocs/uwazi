import prioritySortingCriteria from '../prioritySortingCriteria';

describe('prioritySortingCriteria', () => {
  it('should return an object with global default sort and oder', () => {
    expect(prioritySortingCriteria()).toEqual({sort: 'creationDate', order: 'desc', treatAs: 'number'});
  });

  it('should allow overriding the entire result (useful for fixed orders)', () => {
    const options = {override: {sort: 'anotherProperty', order: 'asc', treatAs: 'string'}};
    expect(prioritySortingCriteria(options)).toBe(options.override);
  });
});
