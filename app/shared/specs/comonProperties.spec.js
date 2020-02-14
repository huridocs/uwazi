import propertiesHelper from '../comonProperties';

describe('comonProperties', () => {
  const templates = [
    {
      _id: '1',
      properties: [
        { name: 'author', filter: false, type: 'text', defaultfilter: true },
        { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
        { name: 'date', filter: true, type: 'text', defaultfilter: true },
        { name: 'language', filter: true, type: 'text' },
      ],
    },
    {
      _id: '2',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
        { name: 'language', filter: false, type: 'text', required: true },
      ],
    },
    {
      _id: '3',
      properties: [
        { name: 'author', filter: false, type: 'markdown' },
        { name: 'country', filter: true, type: 'text' },
        { name: 'friend', relationType: '4', type: 'relationshipfilter' },
      ],
    },
  ];

  const relationTypes = [
    {
      _id: '4',
      properties: [
        { name: 'author', filter: false, type: 'markdown' },
        { name: 'city', filter: true, type: 'text' },
      ],
    },
  ];

  const thesauris = [
    {
      _id: 'abc1',
      values: [
        { id: 1, value: 'value1' },
        { id: 2, value: 'value2' },
      ],
    },
  ];

  describe('comonProperties()', () => {
    describe('When only one documentType is selected', () => {
      it('should return all its fields with thesauri options', () => {
        const documentTypes = ['1'];
        const filters = propertiesHelper.comonProperties(templates, documentTypes, thesauris);
        expect(filters).toEqual([
          { name: 'author', filter: false, type: 'text', defaultfilter: true },
          { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
          { name: 'date', filter: true, type: 'text', defaultfilter: true },
          { name: 'language', filter: true, type: 'text' },
        ]);
      });
    });

    describe('When more than one documentType is selected', () => {
      it('should return all fields that are in the selected templates selecting those that are required', () => {
        const documentTypes = ['1', '2'];
        const filters = propertiesHelper.comonProperties(templates, documentTypes);
        expect(filters).toEqual([
          { name: 'author', filter: false, type: 'text', defaultfilter: true },
          { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
          { name: 'language', filter: false, type: 'text', required: true },
        ]);
      });

      describe('when none match', () => {
        it('should return none', () => {
          const documentTypes = ['1', '2', '3'];
          const filters = propertiesHelper.comonProperties(templates, documentTypes);
          expect(filters).toEqual([]);
        });
      });
    });
  });

  describe('defaultFilters()', () => {
    it('should return a llist of unique filters marked as default', () => {
      const filters = propertiesHelper.defaultFilters(templates);
      expect(filters).toEqual([
        { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
        { name: 'date', filter: true, type: 'text', defaultfilter: true },
      ]);
    });
  });

  describe('comonFilters()', () => {
    it('should return all the comon filters of the selected templates', () => {
      const documentTypes = ['3'];
      const filters = propertiesHelper.comonFilters(templates, relationTypes, documentTypes);
      expect(filters).toEqual([
        { name: 'country', filter: true, type: 'text' },
        {
          name: 'friend',
          relationType: '4',
          type: 'relationshipfilter',
          filters: [{ name: 'city', filter: true, type: 'text' }],
        },
      ]);
    });
  });
});
