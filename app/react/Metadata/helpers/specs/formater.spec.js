import Immutable from 'immutable';

import { formatMetadata } from '../../selectors';
import formater from '../formater';
import { fromJS } from 'immutable';
import Map from 'app/Map/Map';

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
        geolocation: { lat: 2, lon: 3 }
      }
    };

    templates = fromJS([
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
          { name: 'relationship2', type: 'relationship', label: 'Relationship 2', content: null, relationType: 'relationType1' },
          { name: 'geolocation', type: 'geolocation', label: 'Geolocation', showInCard: true }
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
        values: [{ label: 'Value 4', id: 'value4', _id: 'value4' }]
      }
    ]);
  });

  function assessBasicProperties(element, options) {
    expect(element.label).toBe(options[0]);
    expect(element.name).toBe(options[1]);
    expect(element.translateContext).toBe(options[2]);

    if (options.length > 3) {
      expect(element.value).toBe(options[3]);
    }
  }

  function assessMultiValues(element, values, secondaryDepth) {
    values.forEach((val, index) => {
      const value = secondaryDepth ? element.value[index].value : element.value[index];
      expect(value).toEqual(val);
    });
  }

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
    let geolocation;

    beforeEach(() => {
      data = formater.prepareMetadata(doc, templates, thesauris);
      [text, date, multiselect, multidate, daterange, multidaterange, markdown, select, relationship1, relationship2, geolocation] = data.metadata;
    });

    const formatValue = value => ({ icon: undefined, url: `/entity/${value.toLowerCase().replace(/ /g, '')}`, value });

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
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
      assessMultiValues(multiselect, ['Value 1', 'Value 2'], true);
    });

    it('should process multidate type', () => {
      assessBasicProperties(multidate, ['Multi Date', 'multidate', 'templateID']);
      assessMultiValues(multidate, [{ timestamp: 10, value: 'Jan 1, 1970' }, { timestamp: 1000000, value: 'Jan 12, 1970' }]);
      expect(multidate.label).toBe('Multi Date');
      expect(multidate.name).toBe('multidate');
      expect(multidate.value[0]).toEqual({ timestamp: 10, value: 'Jan 1, 1970' });
      expect(multidate.value[1]).toEqual({ timestamp: 1000000, value: 'Jan 12, 1970' });
    });

    it('should process daterange type', () => {
      assessBasicProperties(daterange, ['Date Range', 'daterange', 'templateID', 'Jan 1, 1970 ~ Jan 12, 1970']);
    });

    it('should process multidaterange type', () => {
      assessBasicProperties(multidaterange, ['Multi Date Range', 'multidaterange', 'templateID']);
      assessMultiValues(multidaterange, ['Jan 1, 1970 ~ Jan 12, 1970', 'Jan 24, 1970 ~ Feb 4, 1970'], true);
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
      assessMultiValues(relationship1, [formatValue('Value 1'), formatValue('Value 2')]);
    });

    it('should process free relationsip types', () => {
      assessBasicProperties(relationship2, ['Relationship 2', 'relationship2', 'templateID']);
      expect(relationship2.value.length).toBe(3);
      assessMultiValues(relationship2, [formatValue('Value 1'), formatValue('Value 2'), formatValue('Value 4')]);
    });

    it('should not fail when field do not exists on the document', () => {
      doc.metadata.relationship1 = null;
      doc.metadata.multiselect = null;
      doc.metadata.select = null;
      expect(formater.prepareMetadata.bind(formater, doc, templates, thesauris)).not.toThrow();
    });

    it('should render a Map for geolocation fields', () => {
      expect(geolocation.value.type).toBe(Map);
      expect(geolocation.value.props.latitude).toBe(2);
      expect(geolocation.value.props.longitude).toBe(3);
    });
  });

  describe('prepareMetadataForCard', () => {
    let data;

    let text;
    let markdown;
    let creationDate;
    let geolocation;

    beforeEach(() => {
      data = formater.prepareMetadataForCard(doc, templates, thesauris);
      [text, markdown, geolocation] = data.metadata;
    });

    it('should maintain doc original data untouched', () => {
      expect(data.title).toBe(doc.title);
      expect(data.template).toBe(doc.template);
    });

    it('should process text type', () => {
      assessBasicProperties(text, ['Text', 'text', 'templateID', 'text content']);
    });

    it('should process markdown type', () => {
      assessBasicProperties(markdown, ['Mark Down', 'markdown', 'templateID', 'markdown content']);
    });

    it('should render a Map for geolocation fields', () => {
      assessBasicProperties(geolocation, ['Geolocation', 'geolocation', 'templateID', 'Lat / Lon: 2 / 3']);
    });

    describe('when sort property passed', () => {
      let date;
      it('should process also the sorted property even if its not a "showInCard"', () => {
        data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.date');
        [text, date, markdown] = data.metadata;
        assessBasicProperties(date, ['Date', 'date', 'templateID']);
        expect(data.metadata.length).toBe(4);
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
          [text, markdown, geolocation, creationDate] = data.metadata;
          expect(text.sortedBy).toBe(false);
          expect(markdown.sortedBy).toBe(false);
          assessBasicProperties(creationDate, ['Date added', undefined, 'System', 'Jan 1, 1970']);
          expect(creationDate.sortedBy).toBe(true);
        });
      });

      describe('when sort property does not exists in the metadata', () => {
        it('should return a property with null as value', () => {
          templates = templates.push(Immutable.fromJS({
            _id: 'otherTemplate',
            properties: [{ name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }]
          }));

          data = formater.prepareMetadataForCard(doc, templates, thesauris, 'metadata.nonexistent');
          const nonexistent = data.metadata.find(p => p.name === 'nonexistent');
          assessBasicProperties(nonexistent, ['NonExistentLabel', 'nonexistent', 'otherTemplate']);
          expect(nonexistent.type).toBe(null);
        });

        it('should ignore non metadata properties', () => {
          templates = templates.push(Immutable.fromJS({
            properties: [{ name: 'nonexistent', type: 'date', label: 'NonExistentLabel' }]
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
