import helpers from 'app/Documents/helpers.js';

describe('document helpers', () => {
  let templates = [
    {_id: '1', properties: [
      {name: 'author', filter: false, type: 'text'}
    ]},
    {_id: '2', properties: [
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
    it('should prepare metadata with label and thesauri values', () => {
      expect(helpers.prepareMetadata(doc, templates, thesauris)).toEqual({
        title: 'doc title',
        template: '2',
        metadata: [
          {label: 'authorLabel', value: 'authorValue'},
          {label: 'countryLabel', value: 'countryValue'},
          {label: 'languageLabel', value: 'languageValue'}
        ]
      });
    });
  });
});
