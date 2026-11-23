import { metadataFormKey, type FormMetadataProperty } from '../formatMetadataForForm.js';
import {
  apiValidationsToEditEntityErrors,
  applyEditEntityErrors,
  getFirstEditEntityErrorPath,
  getMetadataFieldPath,
  resolveMetadataErrorPath,
} from '../editEntityErrors.js';

describe('editEntityErrors', () => {
  const properties: FormMetadataProperty[] = [
    { _id: '1', type: 'text', name: 'simple_text', label: 'Text' },
    { _id: '2', type: 'select', name: 'status_selection', label: 'Select', content: 'thes2' },
    {
      _id: '3',
      type: 'relationship',
      name: 'related_people',
      label: 'Owner',
      content: 'template2',
      relationType: 'rel1',
    },
    {
      _id: '4',
      type: 'relationship',
      name: 'related_residents',
      label: 'Residents',
      content: 'template2',
      relationType: 'rel1',
    },
    { _id: '5', type: 'nested', name: 'violations_table', label: 'Violations' },
    { _id: '6', type: 'geolocation', name: 'location_on_map', label: 'Location' },
  ];

  it('should map metadata property types to form field paths', () => {
    expect(getMetadataFieldPath(properties[0])).toBe('metadata.simple_text.0.value');
    expect(getMetadataFieldPath(properties[1])).toBe('metadata.status_selection');
    expect(getMetadataFieldPath(properties[4])).toBe('metadata.violations_table');
    expect(getMetadataFieldPath(properties[5])).toBe('metadata.location_on_map');
    expect(
      getMetadataFieldPath({
        _id: '7',
        type: 'markdown',
        name: "hrd's_bio_and_work",
        label: 'Bio',
      })
    ).toBe(`metadata.${metadataFormKey("hrd's_bio_and_work")}.0.value`);
  });

  it('should map grouped relationship errors to the primary field path', () => {
    const relationshipPrimaryNames = new Map([
      ['related_people', 'related_people'],
      ['related_residents', 'related_people'],
    ]);

    expect(resolveMetadataErrorPath(properties[3], relationshipPrimaryNames)).toBe(
      'metadata.related_people'
    );
  });

  it('should apply external errors through setError', () => {
    const setError = jest.fn();

    applyEditEntityErrors(
      setError,
      {
        title: 'Title is invalid',
        metadata: {
          simple_text: 'Text is invalid',
          related_residents: 'Relationship is invalid',
        },
      },
      properties
    );

    expect(setError).toHaveBeenCalledWith('title', {
      type: 'server',
      message: 'Title is invalid',
    });
    expect(setError).toHaveBeenCalledWith('metadata.simple_text.0.value', {
      type: 'server',
      message: 'Text is invalid',
    });
    expect(setError).toHaveBeenCalledWith('metadata.related_people', {
      type: 'server',
      message: 'Relationship is invalid',
    });
  });

  it('should return the first error path in template order', () => {
    expect(
      getFirstEditEntityErrorPath(
        {
          metadata: {
            related_residents: 'Relationship is invalid',
            simple_text: 'Text is invalid',
          },
        },
        properties
      )
    ).toBe('metadata.simple_text.0.value');
  });

  it('should map api validations to edit entity errors', () => {
    expect(
      apiValidationsToEditEntityErrors([
        { instancePath: ".metadata['simple_text']", message: 'Text is invalid' },
        { instancePath: '.template', message: 'Template is invalid' },
        { instancePath: '/metadata/status_selection/0/value', message: 'Select is invalid' },
      ])
    ).toEqual({
      template: 'Template is invalid',
      metadata: {
        simple_text: 'Text is invalid',
        status_selection: 'Select is invalid',
      },
    });
  });

  it('should map translation api validations onto the matching field', () => {
    expect(
      apiValidationsToEditEntityErrors([
        { instancePath: '/translations/es/title', message: 'Title is invalid' },
        { instancePath: '/translations/es/simple_text', message: 'Text is invalid' },
        {
          instancePath: '/translations/es/link/0/value/url',
          message: 'Link Property value must be a valid URL.',
        },
      ])
    ).toEqual({
      title: 'Title is invalid',
      metadata: { simple_text: 'Text is invalid', link: 'Invalid URL' },
    });
  });

  describe('domain property messages', () => {
    const linkAndImageProperties: FormMetadataProperty[] = [
      { _id: '10', type: 'link', name: 'link', label: 'Link' },
      { _id: '11', type: 'image', name: 'cover', label: 'Cover' },
    ];

    it('maps nested link url validations onto the link property', () => {
      expect(
        apiValidationsToEditEntityErrors(
          [
            {
              instancePath: '/metadata/link/0/value/url',
              message: 'Link Property value must be a valid URL.',
            },
          ],
          linkAndImageProperties
        )
      ).toEqual({
        metadata: { link: 'Invalid URL' },
      });
    });

    it('maps domain-relative link url validations with a single link property', () => {
      expect(
        apiValidationsToEditEntityErrors(
          [
            {
              instancePath: '/0/value/url',
              message: 'Link Property value must be a valid URL.',
            },
          ],
          linkAndImageProperties
        )
      ).toEqual({
        metadata: { link: 'Invalid URL' },
      });
    });

    it('leaves an untyped url path unmapped when a link and an image both exist', () => {
      expect(
        apiValidationsToEditEntityErrors(
          [{ instancePath: '/0/value/url', message: 'must be a valid URL.' }],
          linkAndImageProperties
        )
      ).toBeUndefined();
    });

    it('maps image url validations onto the image property by message', () => {
      expect(
        apiValidationsToEditEntityErrors(
          [
            {
              instancePath: '/0/value/url',
              message: 'Image Property must be a valid URL.',
            },
          ],
          linkAndImageProperties
        )
      ).toEqual({
        metadata: { cover: 'Invalid URL' },
      });
    });

    const typedProperties: FormMetadataProperty[] = [
      { _id: 'd', type: 'date', name: 'event_date', label: 'Date' },
      { _id: 'dr', type: 'daterange', name: 'span', label: 'Range' },
      { _id: 'md', type: 'multidate', name: 'dates', label: 'Dates' },
      { _id: 'mdr', type: 'multidaterange', name: 'spans', label: 'Ranges' },
      { _id: 'g', type: 'geolocation', name: 'where', label: 'Where' },
      { _id: 'n', type: 'numeric', name: 'count', label: 'Count' },
      { _id: 't', type: 'text', name: 'note', label: 'Note' },
      { _id: 'mk', type: 'markdown', name: 'body', label: 'Body' },
      { _id: 'r', type: 'relationship', name: 'owner', label: 'Owner' },
      { _id: 's', type: 'select', name: 'status', label: 'Status' },
      { _id: 'ne', type: 'nested', name: 'rows', label: 'Rows' },
      { _id: 'me', type: 'media', name: 'clip', label: 'Clip' },
      { _id: 'id', type: 'generatedid', name: 'code', label: 'Code' },
      { _id: 'im', type: 'image', name: 'cover', label: 'Cover' },
    ];

    it.each([
      ['/0/value', 'Date Property value must be provided.', 'event_date'],
      ['/0/value/from', 'Date Range Property "from" value must be provided.', 'span'],
      ['/0/value', 'Multi Date Property value is required', 'dates'],
      ['/0/value/to', 'Multi Date Range Property "to" value must be provided.', 'spans'],
      ['/0/value/lat', 'Geolocation Property latitude must be provided.', 'where'],
      ['/0/value', 'Numeric Property value must be provided.', 'count'],
      ['/0', 'Text Property is required', 'note'],
      ['/0', 'Markdown Property is required', 'body'],
      ['/value', 'Relationship Property is required', 'owner'],
      ['/0/value', 'Select/MultiSelect value must be a non-empty string.', 'status'],
      ['/0', 'Nested Property is required', 'rows'],
      ['/0/value', 'Media Property value must be a non-empty string.', 'clip'],
      ['/0/value', 'Generated ID Property value must be provided.', 'code'],
      ['/0/value', 'Image Property must be a non-empty string.', 'cover'],
    ])('maps %s (%s) onto %s', (instancePath, message, name) => {
      expect(
        apiValidationsToEditEntityErrors([{ instancePath, message }], typedProperties)
      ).toEqual({
        metadata: { [name]: 'This field is required' },
      });
    });
  });
});
