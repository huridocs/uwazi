import {libraryFilters, generateDocumentTypes} from 'app/Library/helpers/libraryFilters';

describe('library helper', () => {
  let templates = [
    {_id: '1', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'},
      {name: 'date', filter: true, type: 'text'}
    ]},
    {_id: '2', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'}
    ]},
    {_id: '3', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'text'}
    ]}
  ];

  let thesauris = [{_id: 'abc1', values: ['thesauri values']}];

  describe('libraryFilters()', () => {
    describe('When only one documentType is selected', () => {
      it('should return all its filters fields with thesauri options', () => {
        let documentTypes = {1: true, 2: false, 3: false};
        let filters = libraryFilters(templates, documentTypes, thesauris);
        expect(filters)
        .toEqual([{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']},
                  {name: 'date', filter: true, type: 'text'}]);
      });
    });

    describe('When more than one documentType is selected', () => {
      it('should return all filters fields that are in the selected templates', () => {
        let documentTypes = {1: true, 2: true, 3: false};
        let filters = libraryFilters(templates, documentTypes, thesauris);
        expect(filters).toEqual([{name: 'country', filter: true, type: 'select', content: 'abc1', options: ['thesauri values']}]);
      });

      describe('when none match', () => {
        it('should return none', () => {
          let documentTypes = {1: true, 2: true, 3: true};
          let filters = libraryFilters(templates, documentTypes, thesauris);
          expect(filters).toEqual([]);
        });
      });
    });
  });

  describe('generateDocumentTypes()', () => {
    it('should generate an object with one document type for each template using the ID', () => {
      expect(generateDocumentTypes(templates)).toEqual({1: false, 2: false, 3: false});
      expect(generateDocumentTypes(templates, true)).toEqual({1: true, 2: true, 3: true});
    });
  });
});
