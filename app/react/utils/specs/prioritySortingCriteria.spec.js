import {fromJS as Immutable} from 'immutable';
import prioritySorting from '../prioritySortingCriteria';

const prioritySortingCriteria = prioritySorting.get;

describe('prioritySortingCriteria', () => {
  it('should return an object with global default sort and oder', () => {
    expect(prioritySortingCriteria()).toEqual({sort: 'creationDate', order: 'desc', treatAs: 'number'});
  });

  it('should allow overriding the entire result (useful for fixed orders)', () => {
    const options = {override: {sort: 'anotherProperty', order: 'asc', treatAs: 'string'}};
    expect(prioritySortingCriteria(options)).toBe(options.override);
  });

  describe('Priority sorting', () => {
    it('should always validate title and creationDate', () => {
      let options;

      options = {
        currentCriteria: {sort: 'title', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([])
      };

      expect(prioritySortingCriteria(options)).toBe(options.currentCriteria);

      options = {
        currentCriteria: {sort: 'creationDate', order: 'asc', treatAs: 'number'},
        filteredTemplates: [],
        templates: Immutable([])
      };

      expect(prioritySortingCriteria(options)).toBe(options.currentCriteria);
    });

    it('should validate the current sorting criteria when all templates (empty array) passed', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property1', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {properties: [{name: 'property0', filter: false, type: 'text'}]},
          {properties: [{name: 'property1', filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toBe(options.currentCriteria);
    });

    it('should reject the current sorting criteria when all templates (empty array) passed and selection is invalid', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property2', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {properties: [{name: 'property0', filter: false, type: 'text'}]},
          {properties: [{name: 'property1', filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'creationDate', order: 'desc', treatAs: 'number'});
    });

    it('should validate the current sorting criteria when filtered templates passed and selection is valid', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property1', order: 'asc', treatAs: 'string'},
        filteredTemplates: ['t2'],
        templates: Immutable([
          {_id: 't1', properties: [{name: 'property0', filter: false, type: 'text'}]},
          {_id: 't2', properties: [{name: 'property1', filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toBe(options.currentCriteria);
    });

    it('should reject the current sorting criteria when filtered templates passed and selection is invalid', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property1', order: 'asc', treatAs: 'string'},
        filteredTemplates: ['t1'],
        templates: Immutable([
          {_id: 't1', properties: [{name: 'property0', filter: false, type: 'text'}]},
          {_id: 't2', properties: [{name: 'property1', filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'creationDate', order: 'desc', treatAs: 'number'});
    });

    it('should weight the priority sorting criteria when all templates passed and selection is invalid', () => {
      const options = {
        currentCriteria: {sort: 'metadata.missingProperty', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {_id: 't1', properties: [{name: 'property0', filter: false, type: 'text'}]},
          {_id: 't2', properties: [{name: 'property1', prioritySorting: true, filter: true, type: 'date'}]},
          {_id: 't3', properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'date'}]},
          {_id: 't4', properties: [{name: 'property1', filter: true, type: 'date'}]},
          {_id: 't5', properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'metadata.property2', order: 'desc', treatAs: 'number'});
    });

    it('should weight the new sorting criteria and choose the first if there is a tie', () => {
      const options = {
        currentCriteria: {sort: 'metadata.missingProperty', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {_id: 't1', properties: [{name: 'property0', filter: false, type: 'text'}]},
          {_id: 't2', properties: [{name: 'property1', prioritySorting: true, filter: true, type: 'text'}]},
          {_id: 't3', properties: [{name: 'property2', filter: true, type: 'date'}]},
          {_id: 't4', properties: [{name: 'property1', filter: true, type: 'text'}]},
          {_id: 't5', properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'date'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'metadata.property1', order: 'asc', treatAs: 'string'});
    });
  });
});
