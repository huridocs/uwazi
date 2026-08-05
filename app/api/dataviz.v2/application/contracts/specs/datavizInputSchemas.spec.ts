import { createDatavizInputSchema, updateDatavizInputSchema } from '../datavizInputSchemas.js';

const validCreateInput = {
  name: 'Cars by color',
  query: {
    sources: [{ templateId: '507f1f77bcf86cd799439011' }],
    dimensions: [{ property: 'color', propertyType: 'select' }],
    measures: [{ aggregation: 'count' }],
  },
  chart: { type: 'pie' },
  appearance: { colorMode: 'from_data' },
  refresh: { refreshMode: 'snapshot_manual' },
};

describe('datavizInputSchemas', () => {
  describe('createDatavizInputSchema', () => {
    it('accepts a valid create payload', () => {
      expect(() => createDatavizInputSchema.parse(validCreateInput)).not.toThrow();
    });

    it('accepts unknown nested fields for forward compatibility', () => {
      expect(() =>
        createDatavizInputSchema.parse({
          ...validCreateInput,
          chart: { type: 'pie', futureOption: true },
          query: {
            ...validCreateInput.query,
            dimensions: [{ property: 'color', propertyType: 'future_type' }],
          },
        })
      ).not.toThrow();
    });

    it('rejects missing name', () => {
      const result = createDatavizInputSchema.safeParse({
        ...validCreateInput,
        name: '   ',
      });

      expect(result.success).toBe(false);
    });

    it('rejects missing chart type', () => {
      const result = createDatavizInputSchema.safeParse({
        ...validCreateInput,
        chart: { showLegend: true },
      });

      expect(result.success).toBe(false);
    });

    it('rejects empty measures', () => {
      const result = createDatavizInputSchema.safeParse({
        ...validCreateInput,
        query: {
          ...validCreateInput.query,
          measures: [],
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateDatavizInputSchema', () => {
    it('requires id', () => {
      const result = updateDatavizInputSchema.safeParse(validCreateInput);

      expect(result.success).toBe(false);
    });

    it('accepts a valid update payload', () => {
      expect(() =>
        updateDatavizInputSchema.parse({
          ...validCreateInput,
          id: 'dv_1',
        })
      ).not.toThrow();
    });
  });
});
