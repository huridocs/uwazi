/* eslint-disable max-statements */
import { CreateEntitySchema } from '#api/core/infrastructure/express/entity/Schemas.js';

describe('CreateEntitySchema', () => {
  it('should parse all property types correctly (happy path)', () => {
    const input = {
      title: 'Test Entity',
      template: '6925f7567e817ee96cd2efa6',
      metadata: {
        text_property: [{ value: 'Some text value' }],
        numeric_property: [{ value: 42 }],
        boolean_property: [{ value: true }],
        null_property: [{ value: null }],
        daterange: [{ value: { from: 1764374400, to: 1762300799 } }],
        multidaterange: [
          { value: { from: 1762214400, to: 1763683199 } },
          { value: { from: 1764374400, to: 1765065599 } },
        ],
        geolocation_geolocation: [
          { value: { lat: 45.240656922909196, lon: 5.173634551384034, label: 'Location 1' } },
        ],
        link_property: [{ value: { label: 'Example', url: 'https://example.com' } }],
      },
    };

    const result = CreateEntitySchema.parse(input);

    // Assert title and template
    expect(result.title).toBe('Test Entity');
    expect(result.template).toBe('6925f7567e817ee96cd2efa6');

    // Assert text property
    expect(result.metadata?.text_property[0].value).toBe('Some text value');

    // Assert numeric property
    expect(result.metadata?.numeric_property[0].value).toBe(42);

    // Assert boolean property
    expect(result.metadata?.boolean_property[0].value).toBe(true);

    // Assert null property
    expect(result.metadata?.null_property[0].value).toBe(null);

    // Assert daterange property
    expect(result.metadata?.daterange[0].value).toEqual({ from: 1764374400, to: 1762300799 });

    // Assert multidaterange property
    expect(result.metadata?.multidaterange[0].value).toEqual({
      from: 1762214400,
      to: 1763683199,
    });
    expect(result.metadata?.multidaterange[1].value).toEqual({
      from: 1764374400,
      to: 1765065599,
    });

    // Assert geolocation property
    expect(result.metadata?.geolocation_geolocation[0].value).toEqual({
      lat: 45.240656922909196,
      lon: 5.173634551384034,
      label: 'Location 1',
    });

    // Assert link property
    expect(result.metadata?.link_property[0].value).toEqual({
      label: 'Example',
      url: 'https://example.com',
    });
  });
});
