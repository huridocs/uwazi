import type { FormMetadataProperty } from '../formatMetadataForForm.js';
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
});
