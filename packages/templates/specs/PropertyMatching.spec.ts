import { PropertyMatching, TemplateInput } from '#templates';

const cases: TemplateInput = {
  _id: 'cases',
  name: 'Cases',
  commonProperties: [
    { _id: 'cases-title', label: 'Title', name: 'title', type: 'text' },
    { _id: 'cases-created', label: 'Date added', name: 'creationDate', type: 'date' },
  ],
  properties: [
    { _id: 'cases-test', label: 'T!est', name: 't_est', type: 'text' },
    {
      _id: 'cases-country',
      label: 'Country',
      name: 'country',
      type: 'select',
      content: 'countries',
    },
    {
      _id: 'cases-victim',
      label: 'Victim',
      name: 'victim',
      type: 'relationship',
      content: 'people',
      relationType: 'victim-of',
      inherit: { property: 'people-age', type: 'numeric' },
    },
    { _id: 'cases-legacy', label: 'Renamed later', name: 'legacy_name', type: 'text' },
  ],
};

const people: TemplateInput = {
  _id: 'people',
  name: 'People',
  properties: [
    { _id: 'people-test', label: 'T-est', name: 't_est', type: 'markdown' },
    {
      _id: 'people-country',
      label: 'Country',
      name: 'country',
      type: 'select',
      content: 'regions',
    },
  ],
};

describe('PropertyMatching', () => {
  describe('nameFor()', () => {
    it('should derive the name save would give the property', () => {
      expect(PropertyMatching.nameFor({ label: ' T?est ', type: 'text' })).toBe('t_est');
    });

    it('should add the type suffix for geolocation and nested properties', () => {
      expect(PropertyMatching.nameFor({ label: 'Location', type: 'geolocation' })).toBe(
        'location_geolocation'
      );
      expect(PropertyMatching.nameFor({ label: 'Rows', type: 'nested' })).toBe('rows_nested');
    });

    it('should ignore a name the property already has, because save re-derives it', () => {
      expect(
        PropertyMatching.nameFor({ label: 'New label', name: 'old_label', type: 'text' })
      ).toBe('new_label');
    });
  });

  describe('findMatches()', () => {
    it('should match by derived name, not by label', () => {
      const result = PropertyMatching.findMatches({ label: 'T?est', type: 'numeric' }, [cases]);

      expect(result).toEqual({
        name: 't_est',
        matches: [
          {
            templateId: 'cases',
            templateName: 'Cases',
            propertyId: 'cases-test',
            label: 'T!est',
            type: 'text',
            conflicts: ['type'],
          },
        ],
      });
    });

    it('should report no conflicts for compatible types', () => {
      const result = PropertyMatching.findMatches({ label: 'T?est', type: 'markdown' }, [
        cases,
        people,
      ]);

      expect(result.matches).toEqual([
        expect.objectContaining({ templateId: 'cases', conflicts: [] }),
        expect.objectContaining({ templateId: 'people', conflicts: [] }),
      ]);
    });

    it('should report a content conflict for a select on another thesaurus', () => {
      const result = PropertyMatching.findMatches(
        { label: 'Country', type: 'multiselect', content: 'countries' },
        [cases, people]
      );

      expect(result.matches).toEqual([
        expect.objectContaining({ templateId: 'cases', conflicts: [] }),
        expect.objectContaining({ templateId: 'people', conflicts: ['content'] }),
      ]);
    });

    it('should report an inheritType conflict for a relationship inheriting another type', () => {
      const result = PropertyMatching.findMatches(
        {
          label: 'Victim',
          type: 'relationship',
          content: 'people',
          relationType: 'victim-of',
          inherit: { property: 'people-name', type: 'text' },
        },
        [cases]
      );

      expect(result.matches).toEqual([
        expect.objectContaining({ propertyId: 'cases-victim', conflicts: ['inheritType'] }),
      ]);
    });

    it('should report a relationType conflict for a relationship using another relationship type', () => {
      const result = PropertyMatching.findMatches(
        {
          label: 'Victim',
          type: 'relationship',
          content: 'people',
          relationType: 'witness-of',
          inherit: { property: 'people-age', type: 'numeric' },
        },
        [cases]
      );

      expect(result.matches).toEqual([
        expect.objectContaining({ propertyId: 'cases-victim', conflicts: ['relationType'] }),
      ]);
    });

    it('should report a content conflict for a relationship to another template', () => {
      const result = PropertyMatching.findMatches(
        {
          label: 'Victim',
          type: 'relationship',
          relationType: 'victim-of',
          inherit: { property: 'people-age', type: 'numeric' },
        },
        [cases]
      );

      expect(result.matches).toEqual([
        expect.objectContaining({ propertyId: 'cases-victim', conflicts: ['content'] }),
      ]);
    });

    it('should match the stored name of other templates, not one derived from their label', () => {
      expect(
        PropertyMatching.findMatches({ label: 'Renamed later', type: 'text' }, [cases]).matches
      ).toEqual([]);

      expect(
        PropertyMatching.findMatches({ label: 'Legacy name', type: 'numeric' }, [cases]).matches
      ).toEqual([expect.objectContaining({ propertyId: 'cases-legacy', conflicts: ['type'] })]);
    });

    it('should not match common properties, as save does not compare them across templates', () => {
      expect(
        PropertyMatching.findMatches({ label: 'Title', type: 'date' }, [cases]).matches
      ).toEqual([]);
    });

    it('should leave out the template being edited', () => {
      const result = PropertyMatching.findMatches(
        { label: 'T?est', type: 'text' },
        [cases, people],
        {
          templateId: 'cases',
        }
      );

      expect(result.matches).toEqual([expect.objectContaining({ templateId: 'people' })]);
    });

    it('should accept ObjectId-like ids', () => {
      const withObjectIds: TemplateInput = {
        ...people,
        _id: { toString: () => 'people' },
        properties: [{ ...people.properties![0], _id: { toString: () => 'people-test' } }],
      };

      const result = PropertyMatching.findMatches(
        { label: 'T?est', type: 'text' },
        [withObjectIds],
        {
          templateId: 'people',
        }
      );

      expect(result.matches).toEqual([]);
    });

    it('should still match a property that is not complete yet', () => {
      const result = PropertyMatching.findMatches({ label: 'Country', type: 'select' }, [cases]);

      expect(result.matches).toEqual([
        expect.objectContaining({ propertyId: 'cases-country', conflicts: [] }),
      ]);
    });

    it('should still match properties of a type the domain does not build', () => {
      const result = PropertyMatching.findMatches({ label: 'T?est', type: 'newRelationship' }, [
        cases,
      ]);

      expect(result.matches).toEqual([
        expect.objectContaining({ propertyId: 'cases-test', conflicts: ['type'] }),
      ]);
    });
  });

  describe('findDuplicateInTemplate()', () => {
    it('should find a sibling whose label derives the same name', () => {
      const duplicate = PropertyMatching.findDuplicateInTemplate(
        { label: 'T?est', type: 'numeric' },
        cases
      );

      expect(duplicate).toEqual({
        propertyId: 'cases-test',
        label: 'T!est',
        name: 't_est',
        isCommonProperty: false,
      });
    });

    it('should derive sibling names from their current labels, as save does', () => {
      expect(
        PropertyMatching.findDuplicateInTemplate({ label: 'Legacy name', type: 'text' }, cases)
      ).toBeUndefined();

      expect(
        PropertyMatching.findDuplicateInTemplate({ label: 'Renamed later', type: 'date' }, cases)
      ).toEqual(expect.objectContaining({ propertyId: 'cases-legacy', name: 'renamed_later' }));
    });

    it('should find a common property with the same name', () => {
      expect(
        PropertyMatching.findDuplicateInTemplate({ label: ' title', type: 'numeric' }, cases)
      ).toEqual({
        propertyId: 'cases-title',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
      });
    });

    it('should skip the property being edited', () => {
      expect(
        PropertyMatching.findDuplicateInTemplate(
          { _id: 'cases-test', label: 'T?est', type: 'text' },
          cases
        )
      ).toBeUndefined();
    });

    it('should return undefined when nothing shares the name', () => {
      expect(
        PropertyMatching.findDuplicateInTemplate({ label: 'Unique', type: 'text' }, cases)
      ).toBeUndefined();
    });
  });
});
