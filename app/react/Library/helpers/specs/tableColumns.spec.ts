import { TemplateSchema } from 'shared/types/templateType';
import { getTableColumns } from '../tableColumns';

describe('getTableColumns', () => {
  const documents = {
    rows: [{ title: 'document1' }, { title: 'document2' }, { title: 'document3' }],
    aggregations: {
      all: {
        _types: {
          buckets: [
            { key: 'idTemplate1', doc_count: 54, filtered: { doc_count: 2 } },
            { key: 'idTemplate2', doc_count: 4, filtered: { doc_count: 0 } },
            { key: 'idTemplate3', doc_count: 4, filtered: { doc_count: 3 } },
            { key: 'idTemplate4', doc_count: 4, filtered: { doc_count: 1 } },
          ],
        },
      },
    },
  };
  const templates: TemplateSchema[] = [
    {
      _id: 'idTemplate1',
      name: 'Template1',
      properties: [
        { label: 'Date', name: 'date', type: 'date' },
        { label: 'Image', name: 'image', type: 'image' },
      ],
      commonProperties: [
        { label: 'Titulo', name: 'title', type: 'text' },
        { label: 'Created at', name: 'creationDate', type: 'date' },
      ],
    },
    {
      _id: 'idTemplate2',
      name: 'Template2',
      properties: [
        { label: 'Date', name: 'date', type: 'date' },
        { label: 'Country', name: 'country', type: 'select' },
      ],
    },
    {
      _id: 'idTemplate3',
      name: 'Template3',
      properties: [
        { label: 'Country', name: 'country', type: 'select' },
        { label: 'Date', name: 'date', type: 'date' },
        { label: 'Media', name: 'media', type: 'media' },
        { label: 'Preview', name: 'preview', type: 'preview' },
      ],
    },
    {
      _id: 'idTemplate4',
      name: 'Template4',
    },
  ];
  const columns = getTableColumns(documents, templates);
  it('should not have duplicated properties', () => {
    const countDate = columns.filter((column: any) => column.label === 'Date').length;
    const countCountry = columns.filter((column: any) => column.label === 'Country').length;
    expect(countDate).toBe(1);
    expect(countCountry).toBe(1);
  });

  it('should contain the properties of all entities', () => {
    expect(columns[0].label).toBe('Titulo');
    expect(columns[1].label).toBe('Created at');
    expect(columns[2].label).toBe('Template');
    expect(columns[3].label).toBe('Date');
  });

  it('should not contain properties of image, preview or media type', () => {
    const countComplexTypes = columns.filter((column: any) =>
      ['image', 'preview', 'media'].includes(column.type)
    ).length;
    expect(countComplexTypes).toBe(0);
  });

  it('should return the common properties with hidden false', () => {
    const commonProperties = columns.filter(
      (column: any) =>
        ['title', 'creationDate', 'template'].includes(column.name) && column.hidden === false
    ).length;
    expect(commonProperties).toBe(3);
  });
});
