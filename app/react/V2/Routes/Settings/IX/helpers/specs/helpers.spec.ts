/**
 * @jest-environment jsdom
 */

import * as translate from 'app/I18N/translateFunction';
import { formatOptions } from '../../components/ExtractorModal';
import { formatExtractors } from '../../IXDashboard';
import { getAvailableSources, generateChildrenRows, formatAccepted } from '../helpers';
import { extractors, templates, templatesWithCommonProperties } from './fixtures';
import { MultiValueSuggestion } from '../../types';

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
          source: 'PDF',
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
          source: 'Descripción',
        },
        {
          _id: 'exractor3',
          name: 'Dates from titles',
          property: 'fecha',
          templates: ['1', '2', '3', '5'],
          namedTemplates: [
            'Mecanismo',
            'Ordenes de la corte',
            'Informe de admisibilidad',
            'Ordenes del presidente',
          ],
          propertyType: 'date',
          propertyLabel: 'Fecha',
          rowId: 'exractor3',
          source: 'Title',
        },
      ]);
    });
  });

  describe('getAvailableSources', () => {
    beforeAll(() => {
      jest.spyOn(translate, 't');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return the pdf source by default and include title as an option', () => {
      const result = getAvailableSources(templates, []);
      expect(result).toEqual([
        { label: 'PDF', value: '0', defaultChecked: true },
        { label: 'Title', value: 'title', defaultChecked: false },
      ]);
      expect(translate.t).toHaveBeenCalledWith('System', 'PDF', 'PDF', false);
      expect(translate.t).toHaveBeenCalledWith('System', 'Title', 'Title', false);
    });

    it('should return the default if there is no common text field between templates', () => {
      const result = getAvailableSources(templates, ['1-fecha', '3-fecha', '2-fecha']);
      expect(result).toEqual([
        { label: 'PDF', value: '0', defaultChecked: true },
        { label: 'Title', value: 'title', defaultChecked: false },
      ]);
    });

    it('should exclude a source if it is the target property', () => {
      const result = getAvailableSources(templates, ['1-title', '3-title', '2-title']);
      expect(result).toEqual([{ label: 'PDF', value: '0', defaultChecked: true }]);
    });

    it('should return the default if text fields have diferent names', () => {
      const result = getAvailableSources(templates, ['1-title', '5-title']);
      expect(result).toEqual([{ label: 'PDF', value: '0', defaultChecked: true }]);
    });

    it('should return the common text fields amongst templates', () => {
      const result = getAvailableSources(templates, ['1-fecha', '3-fecha']);
      expect(result).toEqual([
        { label: 'PDF', value: '0', defaultChecked: true },
        { label: 'Title', value: 'title', defaultChecked: false },
        { label: 'Resumen', value: 'resumen', defaultChecked: false },
        { label: 'Descripción', value: 'descripcion', defaultChecked: false },
      ]);
      expect(translate.t).toHaveBeenNthCalledWith(3, '1', 'Resumen', 'Resumen', false);
      expect(translate.t).toHaveBeenNthCalledWith(4, '1', 'Descripción', 'Descripción', false);
    });

    it('should not repeat the common property amongs templates', () => {
      const result = getAvailableSources(
        templates,
        ['4-title', '1-title', '3-title'],
        extractors[1]
      );
      expect(result).toEqual([
        { label: 'PDF', value: '0' },
        { label: 'Descripción', value: 'descripcion', defaultChecked: true },
      ]);
      expect(translate.t).toHaveBeenNthCalledWith(3, '1', 'Descripción', 'Descripción', false);
    });

    it('should return all the common properties amongs templates', () => {
      const result = getAvailableSources(
        templatesWithCommonProperties,
        ['1-fecha', '2-fecha'],
        extractors[1]
      );
      expect(result).toEqual([
        { label: 'PDF', value: '0' },
        { label: 'Title', value: 'title', defaultChecked: false },
        { label: 'Opinión', value: 'opini_n', defaultChecked: false },
        { label: 'Descripción', value: 'descripcion', defaultChecked: true },
      ]);
    });
  });

  describe('generateChildrenRows', () => {
    it('should generate child rows for multiselect with segment', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: [
          { id: 'value1', label: 'Value 1', segment: 'context for value1' },
          { id: 'value2', label: 'Value 2', segment: 'context for value2' },
        ],
        currentValue: ['value1', 'value3'],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: { id: 'value1', label: 'Value 1', segment: 'context for value1' },
        currentValue: 'value1',
        rowId: 'suggestion1-value1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: { id: 'value2', label: 'Value 2', segment: 'context for value2' },
        currentValue: '',
        rowId: 'suggestion1-value2',
        isChild: true,
      });

      expect(result.subRows![2]).toMatchObject({
        suggestedValue: '',
        currentValue: 'value3',
        rowId: 'suggestion1-value3',
        isChild: true,
      });
    });

    it('should generate child rows for multiselect without segment', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: ['value1', 'value2'],
        currentValue: ['value1', 'value3'],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: 'value1',
        currentValue: 'value1',
        rowId: 'suggestion1-value1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: 'value2',
        currentValue: '',
        rowId: 'suggestion1-value2',
        isChild: true,
      });

      expect(result.subRows![2]).toMatchObject({
        suggestedValue: '',
        currentValue: 'value3',
        rowId: 'suggestion1-value3',
        isChild: true,
      });
    });

    it('should handle multiselect suggestions with suggestions as array of ids', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: ['value1', 'value2'],
        currentValue: [''],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: 'value1',
        currentValue: '',
        rowId: 'suggestion1-value1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: 'value2',
        currentValue: '',
        rowId: 'suggestion1-value2',
        isChild: true,
      });
    });

    it('should handle single non-array suggested value', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: 'single_value',
        currentValue: ['current1', 'current2'],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: 'single_value',
        currentValue: '',
        rowId: 'suggestion1-single_value',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: '',
        currentValue: 'current1',
        rowId: 'suggestion1-current1',
        isChild: true,
      });

      expect(result.subRows![2]).toMatchObject({
        suggestedValue: '',
        currentValue: 'current2',
        rowId: 'suggestion1-current2',
        isChild: true,
      });
    });

    it('should handle single non-array current value', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: ['suggested1', 'suggested2'],
        currentValue: 'single_current',
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: 'suggested1',
        currentValue: '',
        rowId: 'suggestion1-suggested1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: 'suggested2',
        currentValue: '',
        rowId: 'suggestion1-suggested2',
        isChild: true,
      });

      expect(result.subRows![2]).toMatchObject({
        suggestedValue: '',
        currentValue: 'single_current',
        rowId: 'suggestion1-single_current',
        isChild: true,
      });
    });

    it('should handle object values with id property', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: [
          { id: 'obj1', label: 'Object 1' },
          { id: 'obj2', label: 'Object 2' },
        ],
        currentValue: [
          { id: 'obj1', label: 'Object 1' },
          { id: 'obj3', label: 'Object 3' },
        ],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(3);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: { id: 'obj1', label: 'Object 1' },
        currentValue: { id: 'obj1', label: 'Object 1' },
        rowId: 'suggestion1-obj1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: { id: 'obj2', label: 'Object 2' },
        currentValue: '',
        rowId: 'suggestion1-obj2',
        isChild: true,
      });

      expect(result.subRows![2]).toMatchObject({
        suggestedValue: '',
        currentValue: { id: 'obj3', label: 'Object 3' },
        rowId: 'suggestion1-obj3',
        isChild: true,
      });
    });

    it('should generate proper rowIds for object values without id property', () => {
      const suggestion: MultiValueSuggestion = {
        _id: 'suggestion1',
        entityId: 'entity1',
        extractorId: 'extractor1',
        entityTemplateId: 'template1',
        sharedId: 'shared1',
        fileId: 'file1',
        entityTitle: 'Test Entity',
        propertyName: 'testProperty',
        suggestedValue: ['suggested1'],
        // @ts-ignore Object without id property
        currentValue: [{ label: 'Object without id' }],
        segment: 'main segment',
        language: 'en',
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: true,
          match: false,
          hasContext: true,
          obsolete: false,
          processing: false,
          error: false,
        },
        date: 1234567890,
        rowId: 'suggestion1',
        extractorSource: { pdf: true },
      };

      const result = generateChildrenRows(suggestion);

      expect(result.subRows).toHaveLength(2);

      expect(result.subRows![0]).toMatchObject({
        suggestedValue: 'suggested1',
        currentValue: '',
        rowId: 'suggestion1-suggested1',
        isChild: true,
      });

      expect(result.subRows![1]).toMatchObject({
        suggestedValue: '',
        currentValue: { label: 'Object without id' },
        rowId: 'suggestion1-Object without id',
        isChild: true,
      });
    });
  });

  describe('formatAccepted', () => {
    const createTestSuggestion = (overrides: any = {}) => ({
      _id: 'suggestion1',
      sharedId: 'shared1',
      entityId: 'entity1',
      isChild: true,
      rowId: 'suggestion1',
      extractorSource: { pdf: true },
      date: 1234567890,
      extractorId: 'extractor1',
      entityTemplateId: 'template1',
      fileId: 'file1',
      entityTitle: 'Test Entity',
      propertyName: 'testProperty',
      segment: 'main segment',
      language: 'en',
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      },
      ...overrides,
    });

    it('should format accepted suggestions with object values (extracting IDs)', () => {
      const acceptedSuggestions = [
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          isChild: true,
          suggestedValue: { id: 'option1', label: 'Option 1', segment: 'segment1' },
          currentValue: { id: 'option2', label: 'Option 2', segment: 'segment2' },
          rowId: 'suggestion1',
          extractorSource: { pdf: true },
          date: 1234567890,
          extractorId: 'extractor1',
          entityTemplateId: 'template1',
          fileId: 'file1',
          entityTitle: 'Test Entity',
          propertyName: 'testProperty',
          segment: 'main segment',
          language: 'en',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
        },
        {
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          isChild: true,
          suggestedValue: { id: 'option3', label: 'Option 3' },
          currentValue: null,
          rowId: 'suggestion2',
          extractorSource: { pdf: true },
          date: 1234567890,
          extractorId: 'extractor1',
          entityTemplateId: 'template1',
          fileId: 'file1',
          entityTitle: 'Test Entity',
          propertyName: 'testProperty',
          segment: 'main segment',
          language: 'en',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
        },
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: ['option1'],
          removedValues: ['option2'],
        },
        {
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          addedValues: ['option3'],
          removedValues: undefined,
        },
      ]);
    });

    it('should format accepted suggestions with string values', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          suggestedValue: 'option1',
          currentValue: 'option2',
        }),
        createTestSuggestion({
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          suggestedValue: 'option3',
          currentValue: null,
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: ['option1'],
          removedValues: ['option2'],
        },
        {
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          addedValues: ['option3'],
          removedValues: undefined,
        },
      ]);
    });

    it('should format accepted suggestions with number values', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          suggestedValue: 123,
          currentValue: 456,
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: ['123'],
          removedValues: ['456'],
        },
      ]);
    });

    it('should handle non-child suggestions (should not process)', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          isChild: false,
          suggestedValue: { id: 'option1', label: 'Option 1' },
          currentValue: { id: 'option2', label: 'Option 2' },
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: undefined,
          removedValues: undefined,
        },
      ]);
    });

    it('should handle null and undefined values', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          suggestedValue: null,
          currentValue: undefined,
        }),
        createTestSuggestion({
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          suggestedValue: undefined,
          currentValue: null,
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: undefined,
          removedValues: undefined,
        },
        {
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          addedValues: undefined,
          removedValues: undefined,
        },
      ]);
    });

    it('should handle mixed value types in the same array', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          suggestedValue: { id: 'option1', label: 'Option 1' },
          currentValue: 'stringValue',
        }),
        createTestSuggestion({
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          suggestedValue: 123,
          currentValue: { id: 'option2', label: 'Option 2' },
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: ['option1'],
          removedValues: ['stringValue'],
        },
        {
          _id: 'suggestion2',
          sharedId: 'shared2',
          entityId: 'entity2',
          addedValues: ['123'],
          removedValues: ['option2'],
        },
      ]);
    });

    it('should handle empty array of suggestions', () => {
      const acceptedSuggestions: any[] = [];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([]);
    });

    it('should preserve all required fields in the output', () => {
      const acceptedSuggestions = [
        createTestSuggestion({
          suggestedValue: { id: 'option1', label: 'Option 1' },
          currentValue: { id: 'option2', label: 'Option 2' },
        }),
      ];

      const result = formatAccepted(acceptedSuggestions);

      expect(result).toEqual([
        {
          _id: 'suggestion1',
          sharedId: 'shared1',
          entityId: 'entity1',
          addedValues: ['option1'],
          removedValues: ['option2'],
        },
      ]);
    });
  });
});
