import { TemplateSchema } from 'shared/types/templateType';
import elasticMapFactory from '../elasticMapFactory';

describe('elasticMapFactory', () => {
  it('should return a mapping based on a template', () => {
    const template: TemplateSchema = {
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

    const mapping = elasticMapFactory(template);
    expect(mapping).toMatchSnapshot();
  });
});
