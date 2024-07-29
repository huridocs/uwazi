import { formatOptions } from '../ExtractorModal';
import { formatExtractors } from '../../IXDashboard';
import { templates } from './fixtures';

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
    const extractors = [
      {
        _id: 'exractor1',
        name: 'Titles',
        property: 'title',
        templates: ['1', '2', '3', '5'],
      },
      {
        _id: 'exractor2',
        name: 'Fechas',
        property: 'fecha',
        templates: ['2'],
      },
    ];

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
        },
      ]);
    });
  });
});
