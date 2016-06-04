import helpers from 'app/Documents/helpers.js';

describe('document helpers', () => {
  let templates = [
    {_id: '1', properties: [
      {name: 'author', filter: false, type: 'text'}
    ]},
    {_id: '2', name: 'template name', properties: [
      {name: 'author', type: 'text', label: 'authorLabel'},
      {name: 'country', type: 'select', content: 'abc1', label: 'countryLabel'},
      {name: 'language', type: 'text', label: 'languageLabel'}
    ]},
    {_id: '3', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'text'}
    ]}
  ];

  let thesauris = [{_id: 'abc1', values: [{id: 'thesauriId', label: 'countryValue'}]}];

  let doc = {title: 'doc title', template: '2', metadata: {
    author: 'authorValue',
    country: 'thesauriId',
    language: 'languageValue'
  }};

  describe('prepareMetadata', () => {
    it('should prepare doc with document_type, metadata with label and thesauri values', () => {
      expect(helpers.prepareMetadata(doc, templates, thesauris)).toEqual({
        title: 'doc title',
        documentType: 'template name',
        template: '2',
        metadata: [
          {label: 'authorLabel', value: 'authorValue'},
          {label: 'countryLabel', value: 'countryValue'},
          {label: 'languageLabel', value: 'languageValue'}
        ]
      });
    });

    describe('when a select has no value', () => {
      it('should not throw an error', () => {
        doc.metadata.country = null;
        expect(helpers.prepareMetadata.bind(null, doc, templates, thesauris)).not.toThrow();
      });
    });

    describe('when no templates provided', () => {
      it('should return the document with empty metadata', () => {
        expect(helpers.prepareMetadata(doc, [], thesauris)).toEqual({
          title: 'doc title',
          template: '2',
          documentType: '',
          metadata: []
        });
      });
    });
  });
});
