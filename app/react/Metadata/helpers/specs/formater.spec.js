import Immutable from 'immutable';

import { formatMetadata } from '../../selectors';
import formater from '../formater';

describe('metadata formater', () => {
  let doc;
  let templates;
  let thesauris;

  beforeEach(() => {
    doc = {
      template: 'templateID',
      title: 'Corte Interamericana de Derechos Humanos',
      creationDate: 0,
      metadata: {
        text: 'text content',
        date: 10,
        multiselect: ['value1', 'value2'],
        multidate: [10, 1000000],
        daterange: { from: 10, to: 1000000 },
        multidaterange: [{ from: 10, to: 1000000 }, { from: 2000000, to: 3000000 }],
        markdown: 'markdown content',
        select: 'value3',
        relationship1: ['value1', 'value2'],
        relationship2: ['value1', 'value2', 'value4'],
        select2: ''
      }
    };

    templates = Immutable.fromJS([
      { _id: 'template' },
      { _id: 'template2' },
      {
        _id: 'templateID',
        name: 'Mecanismo',
        isEntity: true,
        properties: [
          { name: 'text', type: 'text', label: 'Text', showInCard: true },
          { name: 'date', type: 'date', label: 'Date' },
          { name: 'multiselect', content: 'thesauriId', type: 'multiselect', label: 'Multiselect' },
          { name: 'multidate', type: 'multidate', label: 'Multi Date' },
          { name: 'daterange', type: 'daterange', label: 'Date Range' },
          { name: 'multidaterange', type: 'multidaterange', label: 'Multi Date Range' },
          { name: 'markdown', type: 'markdown', label: 'Mark Down', showInCard: true },
          { name: 'select', content: 'thesauriId', type: 'select', label: 'Select' },
          { name: 'relationship1', type: 'relationship', label: 'Relationship', content: 'thesauriId', relationType: 'relationType1' },
          { name: 'relationship2', type: 'relationship', label: 'Relationship 2', content: null, relationType: 'relationType1' }
        ]
      }
    ]);

    thesauris = Immutable.fromJS([
      {
        _id: 'thesauriId',
        name: 'Multiselect',
        type: 'template',
        values: [
          { label: 'Value 1', id: 'value1', _id: 'value1' },
          { label: 'Value 2', id: 'value2', _id: 'value2' },
          { label: 'Value 3', id: 'value3', _id: 'value3' }
        ]
      },
      {
        _id: 'thesauriId2',
        name: 'Multiselect2',
        type: 'template',
        values: [
          { label: 'Value 4', id: 'value4', _id: 'value4' }
        ]
      }
    ]);
  });

  describe('prepareMetadata', () => {
    let data;

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
      [text, date, multiselect, multidate, daterange, multidaterange, markdown, select, relationship1, relationship2] = data.metadata;
    });

    function assessBasicProperties(element, options) {
      expect(element.label).toBe(options[0]);
      expect(element.name).toBe(options[1]);
      expect(element.translateContext).toBe(options[2]);

      if (options.length > 3) {
        expect(element.value).toBe(options[3]);
      }
    }

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
    });

    it('should process all metadata', () => {
      expect(data.metadata.length).toBe(10);
    });

    it('should process text type', () => {
      assessBasicProperties(text, ['Text', 'text', 'templateID', 'text content']);
    });

    it('should process date type', () => {
      assessBasicProperties(date, ['Date', 'date', 'templateID']);
      expect(date.value).toContain('1970');
    });

    it('should process multiselect type', () => {
      assessBasicProperties(multiselect, ['Multiselect', 'multiselect', 'templateID']);
      expect(multiselect.value.length).toBe(2);
      expect(multiselect.value[0].value).toBe('Value 1');
      expect(multiselect.value[1].value).toBe('Value 2');
    });

    it('should process multidate type', () => {
      assessBasicProperties(multidate, ['Multi Date', 'multidate', 'templateID']);
      expect(multidate.value[0]).toEqual({ timestamp: 10, value: 'Jan 1, 1970' });
      expect(multidate.value[1]).toEqual({ timestamp: 1000000, value: 'Jan 12, 1970' });
    });

    it('should process daterange type', () => {
      assessBasicProperties(daterange, ['Date Range', 'daterange', 'templateID', 'Jan 1, 1970 ~ Jan 12, 1970']);
    });

    it('should process multidaterange type', () => {
      assessBasicProperties(multidaterange, ['Multi Date Range', 'multidaterange', 'templateID']);
      expect(multidaterange.value[0].value).toEqual('Jan 1, 1970 ~ Jan 12, 1970');
      expect(multidaterange.value[1].value).toEqual('Jan 24, 1970 ~ Feb 4, 1970');
    });

    it('should process markdown type', () => {
      assessBasicProperties(markdown, ['Mark Down', 'markdown', 'templateID', 'markdown content']);
    });

    it('should process select type', () => {
      assessBasicProperties(select, ['Select', 'select', 'templateID', 'Value 3']);
    });

    it('should process bound relationship types', () => {
      assessBasicProperties(relationship1, ['Relationship', 'relationship1', 'templateID']);
      expect(relationship1.value.length).toBe(2);
      expect(relationship1.value[0].value).toBe('Value 1');
      expect(relationship1.value[0].url).toBe('/entity/value1');
      expect(relationship1.value[1].value).toBe('Value 2');
      expect(relationship1.value[1].url).toBe('/entity/value2');
    });

    it('should process free relationsip types', () => {
      assessBasicProperties(relationship2, ['Relationship 2', 'relationship2', 'templateID']);
      expect(relationship2.value.length).toBe(3);
      expect(relationship2.value[0].value).toBe('Value 1');
      expect(relationship2.value[0].url).toBe('/entity/value1');
      expect(relationship2.value[1].value).toBe('Value 2');
      expect(relationship2.value[1].url).toBe('/entity/value2');
      expect(relationship2.value[2].value).toBe('Value 4');
      expect(relationship2.value[2].url).toBe('/entity/value4');
    });

    it('should not fail when field do not exists on the document', () => {
      doc.metadata.relationship1 = null;
      doc.metadata.multiselect = null;
      doc.metadata.select = null;
      expect(formater.prepareMetadata.bind(formater, doc, templates, thesauris)).not.toThrow();
    });
  });

  describe('prepareMetadataForCard', () => {
    let data;

    let text;
    let markdown;
    let creationDate;

    beforeEach(() => {
      data = formater.prepareMetadataForCard(doc, templates, thesauris);
      [text, markdown] = data.metadata;
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
      expect(markdown.value).toBe('markdown content');
    });

    describe('when sort property passed', () => {
      let date;
      it('should process also the sorted property even if its not a "showInCard"', () => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        [text, date, markdown] = data.metadata;
        expect(data.metadata.length).toBe(3);
        expect(date.label).toBe('Date');
        expect(date.name).toBe('date');
        expect(date.value).toContain('1970');
      });

      it('should add sortedBy true to the property being sorted', () => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        [text, date, markdown] = data.metadata;
        expect(date.sortedBy).toBe(true);
        expect(text.sortedBy).toBe(false);
        expect(markdown.sortedBy).toBe(false);
      });

      describe('when sort property has no value', () => {
        it('should add No Value key and translateContext system to the property', () => {
          doc.metadata.date = '';
          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
          [text, date] = data.metadata;
          expect(date.value).toBe('No value');
          expect(date.translateContext).toBe('System');
        });
      });

      describe('when sort property is creationDate', () => {
        it('should add it as a value to show', () => {
          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'creationDate');
          [text, markdown, creationDate] = data.metadata;
          expect(text.sortedBy).toBe(false);
          expect(markdown.sortedBy).toBe(false);
          expect(creationDate.sortedBy).toBe(true);
          expect(creationDate.value).toBe('Jan 1, 1970');
          expect(creationDate.label).toBe('Date added');
          expect(creationDate.translateContext).toBe('System');
        });
      });

      describe('when sort property does not exists in the metadata', () => {
        it('should return a property with null as value', () => {
          templates = templates.push(Immutable.fromJS({
            _id: 'otherTemplate',
            properties: [
              { name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }
            ]
          }));

          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.nonexistent');
          const nonexistent = data.metadata.find(p => p.name === 'nonexistent');

          expect(nonexistent.type).toBe(null);
          expect(nonexistent.label).toBe('NonExistentLabel');
          expect(nonexistent.translateContext).toBe('otherTemplate');
        });

        it('should ignore non metadata properties', () => {
          templates = templates.push(Immutable.fromJS({
            properties: [
              { name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }
            ]
          }));

          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'nonexistent');
          const nonexistent = data.metadata.find(p => p.name === 'nonexistent');

          expect(nonexistent).not.toBeDefined();
        });
      });
    });
  });

  describe('formatMetadata selector', () => {
    it('should use formater.prepareMetadata', () => {
      spyOn(formater, 'prepareMetadata').and.returnValue({ metadata: 'metadataFormated' });
      const state = { templates, thesauris };
      const metadata = formatMetadata(state, doc);
      expect(metadata).toBe('metadataFormated');
      expect(formater.prepareMetadata).toHaveBeenCalledWith(doc, templates, thesauris);
    });

    describe('when passing sortProperty', () => {
      it('should use formater.prepareMetadataForCard', () => {
        spyOn(formater, 'prepareMetadataForCard').and.returnValue({ metadata: 'metadataFormated' });
        const state = { templates, thesauris };
        const metadata = formatMetadata(state, doc, 'sortProperty');
        expect(metadata).toBe('metadataFormated');
        expect(formater.prepareMetadataForCard).toHaveBeenCalledWith(doc, templates, thesauris, 'sortProperty');
      });
    });
  });
});
