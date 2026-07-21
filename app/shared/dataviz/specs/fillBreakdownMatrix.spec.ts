import { fillBreakdownMatrix } from '#shared/dataviz/fillBreakdownMatrix.js';

describe('fillBreakdownMatrix', () => {
  it('should synthesize missing breakdown entries as zero values', () => {
    const points = fillBreakdownMatrix([
      {
        key: 'co',
        label: 'Colombia',
        value: 10,
        breakdown: [{ key: 'm', label: 'Hombre', value: 10 }],
      },
      {
        key: 'cl',
        label: 'Chile',
        value: 6,
        breakdown: [
          { key: 'm', label: 'Hombre', value: 6 },
          { key: 'f', label: 'Mujer', value: 0 },
        ],
      },
    ]);

    expect(points[0]?.breakdown).toEqual([
      { key: 'm', label: 'Hombre', value: 10 },
      { key: 'f', label: 'Mujer', value: 0 },
    ]);
    expect(points[1]?.breakdown).toEqual([
      { key: 'm', label: 'Hombre', value: 6 },
      { key: 'f', label: 'Mujer', value: 0 },
    ]);
  });
});
