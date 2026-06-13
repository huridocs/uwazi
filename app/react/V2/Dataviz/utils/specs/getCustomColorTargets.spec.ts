import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import {
  carsByColorDto,
  personasSexByCountryDto,
  yearHistogramDto,
} from '#V2/Dataviz/fixtures/datavizFixtures.js';
import {
  getCustomColorTargetKind,
  getCustomColorTargets,
  supportsCustomColorMode,
} from '../getCustomColorTargets.js';

const compareLineDto: DatavizDataDTO = {
  datavizId: 'dv_compare',
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: { totalEntities: 10, truncated: false, queryDurationMs: 50 },
  series: [
    {
      id: 'hombres',
      label: 'Hombres',
      points: [
        { key: '1980', label: 'Jan 1, 1980 ~ Dec 31, 1985', value: 6 },
        { key: '2004', label: 'Jan 1, 2004 ~ Dec 31, 2007', value: 2 },
      ],
    },
    {
      id: 'mujeres',
      label: 'Mujeres',
      points: [
        { key: '1980', label: 'Jan 1, 1980 ~ Dec 31, 1985', value: 0 },
        { key: '2004', label: 'Jan 1, 2004 ~ Dec 31, 2007', value: 3 },
      ],
    },
  ],
};

describe('getCustomColorTargets', () => {
  it('should use series targets for compare line charts', () => {
    expect(getCustomColorTargetKind('line', compareLineDto)).toBe('series');
    expect(supportsCustomColorMode('line', compareLineDto)).toBe(true);

    const targets = getCustomColorTargets('line', compareLineDto);
    expect(targets).toEqual([
      { key: 'hombres', label: 'Hombres' },
      { key: 'mujeres', label: 'Mujeres' },
    ]);
  });

  it('should use series targets for compare bar charts', () => {
    expect(getCustomColorTargetKind('bar', compareLineDto)).toBe('series');
  });

  it('should not support custom colors for single-series line charts', () => {
    expect(getCustomColorTargetKind('line', yearHistogramDto)).toBe('none');
    expect(supportsCustomColorMode('line', yearHistogramDto)).toBe(false);
    expect(getCustomColorTargets('line', yearHistogramDto)).toEqual([]);
  });

  it('should use bucket targets for pie and single-series bar charts', () => {
    expect(getCustomColorTargetKind('pie', carsByColorDto)).toBe('bucket');
    expect(getCustomColorTargetKind('bar', carsByColorDto)).toBe('bucket');

    const targets = getCustomColorTargets('pie', carsByColorDto);
    expect(targets).toHaveLength(6);
    expect(targets[0]).toMatchObject({ key: 'color_black', label: 'Black', defaultColor: '#1a1a1a' });
  });

  it('should use stacked segment targets for stacked bar charts', () => {
    expect(getCustomColorTargetKind('stacked_bar', personasSexByCountryDto)).toBe('stacked_series');

    const targets = getCustomColorTargets('stacked_bar', personasSexByCountryDto);
    expect(targets.map(target => target.key)).toEqual(['sex_female', 'sex_male', 'sex_other']);
    expect(targets[0]).toMatchObject({ label: 'Female', defaultColor: '#D63384' });
  });

  it('should not support custom colors for metric, list, and gauge charts', () => {
    expect(supportsCustomColorMode('metric', carsByColorDto)).toBe(false);
    expect(supportsCustomColorMode('list', carsByColorDto)).toBe(false);
    expect(supportsCustomColorMode('gauge', carsByColorDto)).toBe(false);
  });
});
