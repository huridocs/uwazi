import formater from '../formater';
import {fromJS} from 'immutable';

describe('metadata formater', () => {
  let doc;
  let templates;
  let thesauris;

  beforeEach(() => {
    doc = {
      template: 'templateID',
      title: 'Corte Interamericana de Derechos Humanos',
      metadata: {
        text: 'text content',
        date: 10,
        multiselect: ['value1', 'value2'],
        multidate: [10, 1000000],
        daterange: {from: 10, to: 1000000},
        multidaterange: [{from: 10, to: 1000000}, {from: 2000000, to: 3000000}],
        markdown: 'markdown content',
        select: 'value3'
      },
      relationships: [
        {template: null},
        {template: 'relationType2'},
        {template: 'relationType1', entityData: {template: 'template', title: 'relation2Title', type: 'document', sharedId: 'shared2'}},
        {template: 'relationType1', entityData: {template: 'template2', title: 'relation3Title', type: 'document', sharedId: 'shared3'}},
        {template: 'relationType1', entityData: {template: 'template', title: 'relation1Title', type: 'entity', sharedId: 'shared1'}}
      ]
    };

    templates = fromJS([
      {_id: 'template'},
      {_id: 'template2'},
      {
        _id: 'templateID',
        name: 'Mecanismo',
        isEntity: true,
        properties: [
          {name: 'text', type: 'text', label: 'Text', showInCard: true},
          {name: 'date', type: 'date', label: 'Date'},
          {name: 'multiselect', content: 'thesauriId', type: 'multiselect', label: 'Multiselect'},
          {name: 'multidate', type: 'multidate', label: 'Multi Date'},
          {name: 'daterange', type: 'daterange', label: 'Date Range'},
          {name: 'multidaterange', type: 'multidaterange', label: 'Multi Date Range'},
          {name: 'markdown', type: 'markdown', label: 'Mark Down', showInCard: true},
          {name: 'select', content: 'thesauriId', type: 'select', label: 'Select'},
          {name: 'relationship1', type: 'relationship', label: 'Relationship', content: 'template', relationType: 'relationType1'},
          {name: 'relationship2', type: 'relationship', label: 'Relationship 2', content: null, relationType: 'relationType1'}
        ]
      }
    ]);

    thesauris = fromJS([
      {
        _id: 'thesauriId',
        name: 'Multiselect',
        values: [
          {label: 'Value 1', id: 'value1', _id: 'value1'},
          {label: 'Value 2', id: 'value2', _id: 'value2'},
          {label: 'Value 3', id: 'value3', _id: 'value3'}
        ]
      }
    ]);
  });

  describe('prepareMetadata', () => {
    let data;
    let metadata;

    let text;
    let date;
    let multiselect;
    let multidate;
    let daterange;
    let multidaterange;
    let markdown;
    let select;
    let relationship1;
    let relationship2;

    beforeEach(() => {
      data = formater.prepareMetadata(doc, templates, thesauris);
      metadata = data.metadata;
      [text, date, multiselect, multidate, daterange, multidaterange, markdown, select, relationship1, relationship2] = metadata;
    });

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
    });

    it('should process all metadata', () => {
      expect(data.metadata.length).toBe(10);
    });

    it('should process text type', () => {
      expect(text.label).toBe('Text');
      expect(text.name).toBe('text');
      expect(text.value).toBe('text content');
    });

    it('should process date type', () => {
      expect(date.label).toBe('Date');
      expect(date.name).toBe('date');
      expect(date.value).toContain('1970');
    });

    it('should process multiselect type', () => {
      expect(multiselect.label).toBe('Multiselect');
      expect(multiselect.name).toBe('multiselect');
      expect(multiselect.value.length).toBe(2);
      expect(multiselect.value[0].value).toBe('Value 1');
      expect(multiselect.value[1].value).toBe('Value 2');
    });

    it('should process multidate type', () => {
      expect(multidate.label).toBe('Multi Date');
      expect(multidate.name).toBe('multidate');
      expect(multidate.value[0]).toEqual({timestamp: 10, value: 'Jan 1, 1970'});
      expect(multidate.value[1]).toEqual({timestamp: 1000000, value: 'Jan 12, 1970'});
    });

    it('should process daterange type', () => {
      expect(daterange.label).toBe('Date Range');
      expect(daterange.name).toBe('daterange');
      expect(daterange.value).toEqual('Jan 1, 1970 ~ Jan 12, 1970');
    });

    it('should process multidaterange type', () => {
      expect(multidaterange.label).toBe('Multi Date Range');
      expect(multidaterange.name).toBe('multidaterange');
      expect(multidaterange.value[0].value).toEqual('Jan 1, 1970 ~ Jan 12, 1970');
      expect(multidaterange.value[1].value).toEqual('Jan 24, 1970 ~ Feb 4, 1970');
    });

    it('should process markdown type', () => {
      expect(markdown.label).toBe('Mark Down');
      expect(markdown.name).toBe('markdown');
      expect(markdown.markdown).toBe('markdown content');
    });

    it('should process select type', () => {
      expect(select.label).toBe('Select');
      expect(select.name).toBe('select');
      expect(select.value).toBe('Value 3');
    });

    it('should process bound relationship types', () => {
      expect(relationship1.label).toBe('Relationship');
      expect(relationship1.name).toBe('relationship1');
      expect(relationship1.value.length).toBe(2);
      expect(relationship1.value[0].value).toBe('relation1Title');
      expect(relationship1.value[0].url).toBe('/entity/shared1');
      expect(relationship1.value[1].value).toBe('relation2Title');
      expect(relationship1.value[1].url).toBe('/document/shared2');
    });

    it('should process free relationsip types', () => {
      expect(relationship2.label).toBe('Relationship 2');
      expect(relationship2.name).toBe('relationship2');
      expect(relationship2.value.length).toBe(3);
      expect(relationship2.value[0].value).toBe('relation1Title');
      expect(relationship2.value[0].url).toBe('/entity/shared1');
      expect(relationship2.value[1].value).toBe('relation2Title');
      expect(relationship2.value[1].url).toBe('/document/shared2');
      expect(relationship2.value[2].value).toBe('relation3Title');
      expect(relationship2.value[2].url).toBe('/document/shared3');
    });
  });

  describe('prepareMetadataForCard', () => {
    let data;
    let metadata;

    let text;
    let markdown;

    beforeEach(() => {
      data = formater.prepareMetadataForCard(doc, templates, thesauris);
      metadata = data.metadata;
      [text, markdown] = metadata;
    });

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
    });

    it('should process only showInCard metadata', () => {
      expect(data.metadata.length).toBe(2);
    });

    it('should process text type', () => {
      expect(text.label).toBe('Text');
      expect(text.name).toBe('text');
      expect(text.value).toBe('text content');
    });

    it('should process markdown type', () => {
      expect(markdown.label).toBe('Mark Down');
      expect(markdown.name).toBe('markdown');
      expect(markdown.markdown).toBe('markdown content');
    });

    describe('when sort property passed', () => {
      let date;
      beforeEach(() => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        metadata = data.metadata;
        [text, date, markdown] = metadata;
      });

      it('should process also the sorted property even if its not a "showInCard"', () => {
        expect(data.metadata.length).toBe(3);
        expect(date.label).toBe('Date');
        expect(date.name).toBe('date');
        expect(date.value).toContain('1970');
      });
    });
  });
});

