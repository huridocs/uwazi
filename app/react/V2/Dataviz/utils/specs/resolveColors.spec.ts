import {
  resolveCompareSeriesColor,
  resolveCompareSeriesDisplayLabel,
  resolvePointColor,
} from '../resolveColors.js';

describe('resolveColors', () => {
  it('should use template brand colors for compare series', () => {
    const color = resolveCompareSeriesColor(
      'mecanismo',
      'mecanismo',
      { colorMode: 'template' },
      {
        sources: [
          { templateId: 'tpl-a', alias: 'mecanismo' },
          { templateId: 'tpl-b', alias: 'ordenes_de_la_corte' },
        ],
        templatesById: {
          'tpl-a': { color: '#888888' },
          'tpl-b': { color: '#a3e635' },
        },
      },
      0
    );

    expect(color).toBe('#888888');
  });

  it('should use template names for compare legend labels', () => {
    const label = resolveCompareSeriesDisplayLabel('juez_y_o_comisionado', 'juez_y_o_comisionado', {
      sources: [
        { templateId: 'tpl-juez', alias: 'juez_y_o_comisionado' },
        { templateId: 'tpl-causa', alias: 'causa' },
      ],
      templatesById: {
        'tpl-juez': { name: 'Juez y/o Comisionado' },
        'tpl-causa': { name: 'Causa' },
      },
    });

    expect(label).toBe('Juez y/o Comisionado');
  });

  it('should disambiguate duplicate templates with alias', () => {
    const label = resolveCompareSeriesDisplayLabel('hombres', 'hombres', {
      sources: [
        { templateId: 'tpl-juez', alias: 'hombres' },
        { templateId: 'tpl-juez', alias: 'mujeres' },
      ],
      templatesById: {
        'tpl-juez': { name: 'Juez y/o Comisionado' },
      },
    });

    expect(label).toBe('Juez y/o Comisionado (hombres)');
  });

  it('should use chart palette when template color mode does not apply', () => {
    const color = resolvePointColor(
      { key: 'Argentina', label: 'Argentina', value: 3 },
      { colorMode: 'theme' },
      { index: 1 }
    );

    expect(color).toBe('#7B68EE');
  });
});
