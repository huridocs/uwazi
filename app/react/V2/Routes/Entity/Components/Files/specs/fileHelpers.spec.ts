/**
 * @jest-environment jsdom
 */

import { fileLanguageSelectOptions } from '../fileHelpers.js';

jest.mock('#app/I18N/index.js', () => ({
  t: (_ctx: string, key: string) => key,
}));

describe('fileLanguageSelectOptions', () => {
  it('labels languages with translated names and iso6391', () => {
    const options = fileLanguageSelectOptions('es');
    const spanish = options.find(option => option.value === 'spa');
    const english = options.find(option => option.value === 'eng');

    expect(spanish).toMatchObject({ label: 'Español', iso6391: 'es' });
    expect(english).toMatchObject({ label: 'Inglés', iso6391: 'en' });
    expect(options[options.length - 1]).toEqual({ value: 'other', label: 'other' });
  });

  it('sorts language options by the UI-locale label', () => {
    const labels = fileLanguageSelectOptions('es')
      .slice(0, -1)
      .map(option => option.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'es')));
  });
});
