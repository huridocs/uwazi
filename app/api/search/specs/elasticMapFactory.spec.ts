import { TemplateSchema } from 'shared/types/templateType';
import elasticMapFactory from '../elasticMapFactory';

describe('elasticMapFactory', () => {
  let templates: TemplateSchema[];
  let template: TemplateSchema;
  beforeEach(() => {
    template = {
      name: 'string',
      properties: [
        { label: 'Name', name: 'name', type: 'text' },
        { label: 'Date of birth', name: 'date_of_birth', type: 'date' },
        { label: 'Country', name: 'country', type: 'select' },
        { label: 'Years in prison', name: 'years_in_prison', type: 'daterange' },
        { label: 'Prison location', name: 'prisonLocation', type: 'geolocation' },
        { label: 'Preview', name: 'preview', type: 'preview' },
        { label: 'Photo', name: 'photo', type: 'image' },
        { label: 'External profile', name: 'external_profile', type: 'link' },
        { label: 'Number of incidents', name: 'number_of_incidents', type: 'numeric' },
      ],
    };
    templates = [template];
  });

  describe('mapping()', () => {
    it('should return a mapping based on a template', () => {
      const mapping = elasticMapFactory.mapping(template);
      expect(mapping).toMatchSnapshot();
    });
  });

  describe('aliases()', () => {
    it('should return the alias config for the templates', () => {
      const aliasesDefinition = elasticMapFactory.aliasses(templates);
      expect(aliasesDefinition.properties.metadata.properties['name_text.value']).toEqual({
        path: 'metadata.name.value',
        type: 'alias',
      });
      expect(aliasesDefinition).toMatchSnapshot();
    });
  });

  describe('ingest()', () => {
    it('should return the alias config for the templates', () => {
      const ingestpipeline = elasticMapFactory.ingest(templates);
      expect(ingestpipeline.description).toBe('rename pipeline');

      expect(ingestpipeline.processors[0]).toEqual({
        rename: { field: 'name', target_field: 'name_text' },
      });
      expect(ingestpipeline.processors[1]).toEqual({
        rename: {
          field: 'date_of_birth',
          target_field: 'date_of_birth_date',
        },
      });

      expect(ingestpipeline).toMatchSnapshot();
    });
  });
});
