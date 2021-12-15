import validator, { notEmpty, labelAndUrl, latAndLon } from '../validator';

describe('metadata validator', () => {
  const fieldsTemplate = [
    { name: 'field1', label: 'label1', required: true },
    { name: 'field2', label: 'label2', type: 'select', content: 'thesauriId' },
    { name: 'field3', label: 'label3', required: true },
    { name: 'required_link', label: 'required link', required: true, type: 'link' },
    { name: 'link', label: 'link', required: false, type: 'link' },
    {
      name: 'required_geolocation',
      label: 'required geolocation',
      required: true,
      type: 'geolocation',
    },
    { name: 'geolocation', label: 'geolocation', required: false, type: 'geolocation' },
  ];

  const template = { name: 'template1', _id: 'templateId', properties: fieldsTemplate };

  describe('required', () => {
    it('should return false on empty values', () => {
      expect(notEmpty('')).toBe(false);
      expect(notEmpty('  ')).toBe(false);
      expect(notEmpty({})).toBe(false);
      expect(notEmpty([])).toBe(false);
      expect(notEmpty(null)).toBe(false);
    });

    it('should return true when some value is present', () => {
      expect(notEmpty('value')).toBe(true);
      expect(notEmpty(423)).toBe(true);
      expect(notEmpty(0)).toBe(true);
    });
  });

  describe('latAndLon', () => {
    it('should be true when both or none of the values are present', () => {
      expect(latAndLon([{ lat: 23, lon: 76 }])).toBe(true);
      expect(latAndLon([{ lat: '', lon: '' }])).toBe(true);
      expect(latAndLon([])).toBe(true);
      expect(latAndLon([{}])).toBe(true);
    });

    it('should be false when one value is present and the other is not', () => {
      expect(latAndLon([{ lat: 23, lon: '' }])).toBe(false);
      expect(latAndLon([{ lat: '', lon: 76 }])).toBe(false);
      expect(latAndLon([{ lat: 89 }])).toBe(false);
      expect(latAndLon([{ lon: 42 }])).toBe(false);
    });
  });

  describe('labelAndUrl', () => {
    it('should be true when url or none of the values are present', () => {
      expect(labelAndUrl({ label: '', url: 'cat.pic.com' })).toBe(true);
      expect(labelAndUrl({ label: '', url: '' })).toBe(true);
      expect(labelAndUrl({})).toBe(true);
    });

    it('should be false when label is present and url is not', () => {
      expect(labelAndUrl({ label: 'cat', url: '' })).toBe(false);
      expect(labelAndUrl({ label: 'cat' })).toBe(false);
    });
  });

  describe('generate', () => {
    it('should should generate a validation based on the template passed', () => {
      const validationObject = validator.generate(template);
      expect(validationObject.title).toEqual({ required: notEmpty });
      expect(validationObject['metadata.field1']).toEqual({ required: notEmpty });
      expect(validationObject['metadata.field3']).toEqual({ required: notEmpty });
      expect(validationObject['metadata.link']).toEqual({ required: labelAndUrl });
      expect(validationObject['metadata.required_link.label']).toEqual({ required: notEmpty });
      expect(validationObject['metadata.required_link.url']).toEqual({ required: notEmpty });
      expect(validationObject['metadata.geolocation']).toEqual({ required: latAndLon });
      expect(validationObject['metadata.required_geolocation[0].lat']).toEqual({
        required: notEmpty,
      });
      expect(validationObject['metadata.required_geolocation[0].lon']).toEqual({
        required: notEmpty,
      });
    });
  });
});
