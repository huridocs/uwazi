/**
 * @jest-environment jsdom
 */

import { fileLanguageSelectOptions } from '../fileHelpers.js';

jest.mock('#app/I18N/index.js', () => ({
  t: (_ctx: string, key: string) => key,
}));

describe('fileLanguageSelectOptions', () => {
  it('labels languages in the UI locale and sorts by that label', () => {
    const options = fileLanguageSelectOptions('es');
    const spanish = options.find(option => option.value === 'spa');
    const english = options.find(option => option.value === 'eng');
    const other = options[options.length - 1];

    expect(spanish?.label).toBe('Español - ES');
    expect(english?.label).toBe('Inglés - EN');
    expect(other).toEqual({ key: 'other', value: 'other', label: 'other' });

    const labels = options
      .slice(0, -1)
      .map(option => option.label)
      .filter((label): label is string => typeof label === 'string');
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'es')));
  });
});
