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

    it('should override creationDate as default with weighted templates priority sorting if any exists', () => {
      const options = {
        currentCriteria: null,
        filteredTemplates: [],
        templates: Immutable([
          {_id: 't1', properties: [{name: 'property0', filter: false, type: 'text'}]},
          {_id: 't2', properties: [{name: 'property1', prioritySorting: true, filter: true, type: 'date'}]},
          {_id: 't3', properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'text'}]},
          {_id: 't4', properties: [{name: 'property1', filter: true, type: 'date'}]},
          {_id: 't5', properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'text'}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'metadata.property2', order: 'asc', treatAs: 'string'});
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

    it('should weight the priority sorting criteria and include the common properties into the mix', () => {
      const options = {
        currentCriteria: {sort: 'metadata.missingProperty', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {
            _id: 't1',
            commonProperties: [{name: ''}, {name: 'title', type: 'text', prioritySorting: true}],
            properties: [{name: 'property0', filter: false, type: 'text'}]
          },
          {_id: 't2', properties: [{name: 'property1', prioritySorting: true, filter: true, type: 'date'}]},
          {
            _id: 't3',
            commonProperties: [{name: ''}, {name: 'title', type: 'text', prioritySorting: true}],
            properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'date'}]
          },
          {_id: 't4', properties: [{name: 'property1', filter: true, type: 'date'}]},
          {
            _id: 't5',
            commonProperties: [{name: ''}, {name: 'title', type: 'text', prioritySorting: true}],
            properties: [{name: 'property2', prioritySorting: true, filter: true, type: 'date'}]
          }
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'title', order: 'asc', treatAs: 'string'});
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

    it('should keep the selectedSorting if one exists and is valid for the selection', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property1', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {properties: [{name: 'property0', filter: true, type: 'text'}]},
          {properties: [{name: 'property1', filter: true, type: 'date', prioritySorting: true}]}
        ]),
        selectedSorting: Immutable({sort: 'metadata.property0', order: 'desc', treatAs: 'string'})
      };

      expect(prioritySortingCriteria(options)).toEqual(options.selectedSorting.toJS());
    });

    it('should default to prioritySorting instead of the selectedSorting if one exists and is invalid for the selection', () => {
      const options = {
        currentCriteria: {sort: 'metadata.nonExistentProperty', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {properties: [{name: 'property0', filter: false, type: 'text'}]},
          {properties: [{name: 'property1', filter: true, type: 'date', prioritySorting: true}]}
        ]),
        selectedSorting: Immutable({sort: 'metadata.nonExistentProperty', order: 'desc', treatAs: 'string'})
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'metadata.property1', order: 'desc', treatAs: 'number'});
    });

    it('should default to prioritySorting instead of currentCriteria', () => {
      const options = {
        currentCriteria: {sort: 'metadata.property0', order: 'asc', treatAs: 'string'},
        filteredTemplates: [],
        templates: Immutable([
          {properties: [{name: 'property0', filter: true, type: 'text'}]},
          {properties: [{name: 'property1', filter: true, type: 'date', prioritySorting: true}]}
        ])
      };

      expect(prioritySortingCriteria(options)).toEqual({sort: 'metadata.property1', order: 'desc', treatAs: 'number'});
    });
  });
});
