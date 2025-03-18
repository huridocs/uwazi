import * as translate from 'app/I18N/translateFunction';
import { formatOptions } from '../ExtractorModal';
import { formatExtractors } from '../../IXDashboard';
import { getAvailableSources } from '../helpers';
import { extractors, templates, templatesWithCommonProperties } from './fixtures';

describe('helpers', () => {
  describe('formatOptions', () => {
    it('should return all the options for the select if there are no initial values', () => {
      const result = formatOptions([], templates);
      expect(result).toMatchObject([
        {
          label: 'Mecanismo',
          id: '1',
          searchLabel: 'Mecanismo',
          value: '1',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Resumen',
              value: '1-resumen',
            },
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '1-title',
            },
          ]),
        },
        {
          label: 'Ordenes de la corte',
          id: '2',
          searchLabel: 'Ordenes de la corte',
          value: '2',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Fecha',
              value: '2-fecha',
            },
            {
              label: expect.anything(),
              searchLabel: 'Tipo',
              value: '2-tipo',
            },
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '2-categor_a',
            },
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '2-title',
            },
          ]),
        },
        {
          label: 'Informe de admisibilidad',
          id: '3',
          searchLabel: 'Informe de admisibilidad',
          value: '3',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Fecha',
              value: '3-fecha',
            },
            {
              label: expect.anything(),
              searchLabel: 'Resumen',
              value: '3-resumen',
            },
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '3-title',
            },
          ]),
        },
        {
          label: 'País',
          id: '4',
          searchLabel: 'País',
          value: '4',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '4-categor_a',
            },
            {
              label: expect.anything(),
              searchLabel: 'Tipo',
              value: '4-tipo',
            },
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '4-title',
            },
          ]),
        },
        {
          label: 'Ordenes del presidente',
          id: '5',
          searchLabel: 'Ordenes del presidente',
          value: '5',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '5-categor_a',
            },
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '5-title',
            },
          ]),
        },
      ]);
    });

    it('should filter by values for title', () => {
      const result = formatOptions(['4-title', '5-title'], templates);
      expect(result).toMatchObject([
        {
          label: 'Mecanismo',
          id: '1',
          searchLabel: 'Mecanismo',
          value: '1',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '1-title',
            },
          ]),
        },
        {
          label: 'Ordenes de la corte',
          id: '2',
          searchLabel: 'Ordenes de la corte',
          value: '2',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '2-title',
            },
          ]),
        },
        {
          label: 'Informe de admisibilidad',
          id: '3',
          searchLabel: 'Informe de admisibilidad',
          value: '3',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '3-title',
            },
          ]),
        },
        {
          label: 'País',
          id: '4',
          searchLabel: 'País',
          value: '4',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '4-title',
            },
          ]),
        },
        {
          label: 'Ordenes del presidente',
          id: '5',
          searchLabel: 'Ordenes del presidente',
          value: '5',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Title',
              value: '5-title',
            },
          ]),
        },
      ]);
    });

    it('should filter by values for a property and remove entries with no items', () => {
      const result = formatOptions(['5-categor_a', '4-categor_a'], templates);
      expect(result).toMatchObject([
        {
          label: 'Ordenes de la corte',
          id: '2',
          searchLabel: 'Ordenes de la corte',
          value: '2',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '2-categor_a',
            },
          ]),
        },
        {
          label: 'País',
          id: '4',
          searchLabel: 'País',
          value: '4',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '4-categor_a',
            },
          ]),
        },
        {
          label: 'Ordenes del presidente',
          id: '5',
          searchLabel: 'Ordenes del presidente',
          value: '5',
          items: expect.arrayContaining([
            {
              label: expect.anything(),
              searchLabel: 'Categoría',
              value: '5-categor_a',
            },
          ]),
        },
      ]);
    });
  });

  describe('formatExtractors', () => {
    it('should return the extractor formatted for the table', () => {
      const result = formatExtractors(extractors, templates);
      expect(result).toEqual([
        {
          _id: 'exractor1',
          name: 'Titles',
          property: 'title',
          templates: ['1', '2', '3', '5'],
          namedTemplates: [
            'Mecanismo',
            'Ordenes de la corte',
            'Informe de admisibilidad',
            'Ordenes del presidente',
          ],
          propertyType: 'text',
          propertyLabel: 'Title',
          rowId: 'exractor1',
          source: 'PDF',
        },
        {
          _id: 'exractor2',
          name: 'Fechas',
          property: 'fecha',
          templates: ['2'],
          namedTemplates: ['Ordenes de la corte'],
          propertyType: 'date',
          propertyLabel: 'Fecha',
          rowId: 'exractor2',
          source: 'Descripción',
        },
      ]);
    });
  });

  describe('getAvailableSources', () => {
    beforeAll(() => {
      jest.spyOn(translate, 't');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return the pdf source by default', () => {
      const result = getAvailableSources(templates, []);
      expect(result).toEqual([{ label: 'PDF', value: '0', defaultChecked: true }]);
      expect(translate.t).toHaveBeenCalledWith('System', 'PDF', 'PDF', false);
    });

    it('should return the default if there is no common text field between templates', () => {
      const result = getAvailableSources(templates, [
        '1-Mecanismo',
        '3-Informe de admisibilidad',
        '2-Ordenes de la corte',
      ]);
      expect(result).toEqual([{ label: 'PDF', value: '0', defaultChecked: true }]);
    });

    it('should return the default if text fields have diferent names', () => {
      const result = getAvailableSources(templates, ['1-Mecanismo', '5-Ordenes del presidente']);
      expect(result).toEqual([{ label: 'PDF', value: '0', defaultChecked: true }]);
    });

    it('should return the common text fields amongst templates', () => {
      const result = getAvailableSources(templates, ['1-Mecanismo', '3-Informe de admisibilidad']);
      expect(result).toEqual([
        { label: 'PDF', value: '0', defaultChecked: true },
        { label: 'Descripción', value: 'descripcion', defaultChecked: false },
      ]);
      expect(translate.t).toHaveBeenNthCalledWith(1, 'System', 'PDF', 'PDF', false);
      expect(translate.t).toHaveBeenNthCalledWith(2, '1', 'Descripción', 'Descripción', false);
    });

    it('should not repeat the common property amongs templates', () => {
      const result = getAvailableSources(
        templates,
        ['4-País', '1-Mecanismo', '3-Informe de admisibilidad'],
        extractors[1]
      );
      expect(result).toEqual([
        { label: 'PDF', value: '0' },
        { label: 'Descripción', value: 'descripcion', defaultChecked: true },
      ]);
      expect(translate.t).toHaveBeenNthCalledWith(1, 'System', 'PDF', 'PDF', false);
      expect(translate.t).toHaveBeenNthCalledWith(2, '1', 'Descripción', 'Descripción', false);
    });

    it('should return all the common properties amongs templates', () => {
      const result = getAvailableSources(
        templatesWithCommonProperties,
        ['1-Mecanismo', '2-Ordenes de la corte'],
        extractors[1]
      );
      expect(result).toEqual([
        { label: 'PDF', value: '0' },
        { label: 'Opinión', value: 'opini_n', defaultChecked: false },
        { label: 'Descripción', value: 'descripcion', defaultChecked: true },
      ]);
    });
  });
});
