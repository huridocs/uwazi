import {
  aggregateNumericBreakdown,
  derivePrimaryMeasureFromNumericBreakdown,
  shouldDerivePrimaryMeasureFromNumericBreakdown,
} from '#shared/dataviz/derivePrimaryMeasureFromNumericBreakdown.js';

describe('derivePrimaryMeasureFromNumericBreakdown', () => {
  const dimensions = [
    { property: 'registration_date', propertyType: 'date' as const },
    { property: 'engine_size', propertyType: 'numeric' as const },
  ];

  const breakdown = [
    { key: 1.4, label: '1.4', value: 2 },
    { key: 2.2, label: '2.2', value: 1 },
  ];

  it('should aggregate max from numeric breakdown keys', () => {
    expect(aggregateNumericBreakdown(breakdown, 'max')).toBe(2.2);
    expect(aggregateNumericBreakdown(breakdown, 'min')).toBe(1.4);
    expect(aggregateNumericBreakdown(breakdown, 'avg')).toBeCloseTo((1.4 * 2 + 2.2 * 1) / 3);
    expect(aggregateNumericBreakdown(breakdown, 'sum')).toBeCloseTo(1.4 * 2 + 2.2 * 1);
  });

  it('should derive primary point values for line charts with value measures', () => {
    const points = [
      {
        key: 799744562,
        label: 'May 6, 1995',
        value: 1,
        breakdown: [{ key: 1.4, label: '1.4', value: 1 }],
      },
      {
        key: 815404498,
        label: 'Nov 3, 1995',
        value: 1,
        breakdown: [{ key: 2.2, label: '2.2', value: 1 }],
      },
    ];

    const derived = derivePrimaryMeasureFromNumericBreakdown(points, 'max');
    expect(derived[0]?.value).toBe(1.4);
    expect(derived[1]?.value).toBe(2.2);
  });

  it('should only derive for line-like charts with value measures on numeric cross-tab', () => {
    expect(
      shouldDerivePrimaryMeasureFromNumericBreakdown(
        { type: 'line' },
        dimensions,
        [{ aggregation: 'max' }]
      )
    ).toBe(true);

    expect(
      shouldDerivePrimaryMeasureFromNumericBreakdown(
        { type: 'scatter' },
        dimensions,
        [{ aggregation: 'max' }]
      )
    ).toBe(false);

    expect(
      shouldDerivePrimaryMeasureFromNumericBreakdown(
        { type: 'line' },
        dimensions,
        [{ aggregation: 'count' }]
      )
    ).toBe(false);
  });
});
