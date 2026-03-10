import propertiesHelper from '../commonProperties';

describe('comonProperties', () => {
  const templates = [
    {
      _id: '1',
      properties: [
        { name: 'author', filter: false, type: 'text', defaultfilter: true },
        { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
        { name: 'date', filter: true, type: 'text', defaultfilter: true },
        { name: 'language', filter: true, type: 'text' },
        { name: 'id', filter: false, type: 'generatedid' },
        { name: 'friends', relationType: '4', type: 'relationship' },
      ],
    },
    {
      _id: '2',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1', defaultfilter: true },
        { name: 'language', filter: false, type: 'text', required: true },
        { name: 'id', filter: false, type: 'generatedid' },
        { name: 'friends', relationType: '4', type: 'relationship' },
      ],
    },
    {
      _id: '3',
      properties: [
        { name: 'author', filter: false, type: 'markdown' },
        { name: 'country', filter: true, type: 'text' },
        {
          name: 'friends',
          relationType: '4',
          type: 'relationship',
          inherit: { property: '234', type: 'text' },
        },
      ],
    },
  ];

  describe('comonProperties()', () => {
    describe('When only one documentType is selected', () => {
      it('should return all its fields with thesauri options', () => {
        const documentTypes = ['1'];
        const filters = propertiesHelper.comonProperties(templates, documentTypes);
        expect(filters).toEqual(templates[0].properties);
      });
      it('should not return the properties which types are excluded', () => {
        const documentTypes = ['1'];
        const filters = propertiesHelper.comonProperties(templates, documentTypes, ['generatedid']);
        const expectedProperties = templates[0].properties.filter(p => p.type !== 'generatedid');
        expect(filters).toEqual(expectedProperties);
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
          { name: 'id', filter: false, type: 'generatedid' },
          { name: 'friends', relationType: '4', type: 'relationship' },
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
      const filters = propertiesHelper.comonFilters(templates, documentTypes);
      expect(filters).toEqual([{ name: 'country', filter: true, type: 'text' }]);
    });
  });
});
