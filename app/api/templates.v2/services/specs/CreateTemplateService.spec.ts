import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { CreateTemplateService } from '../CreateTemplateService';

describe('when validating the query', () => {
  it('should check that all the templates of the entities matched are the same', () => {
    const service = new CreateTemplateService();

    try {
      service.createRelationshipProperty({
        name: 'new_relationship',
        type: 'newRelationship',
        label: 'new relationshp',
        query: [
          {
            direction: 'out',
            types: [],
            match: [
              {
                templates: ['template1'],
              },
            ],
          },
          {
            direction: 'in',
            types: [],
            match: [
              {
                templates: [],
              },
            ],
          },
        ],
        denormalizedProperty: 'text1',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
    }
  });
});
