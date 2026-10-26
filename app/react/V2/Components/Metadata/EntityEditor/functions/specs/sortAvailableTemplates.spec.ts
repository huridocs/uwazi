/** @jest-environment jsdom */
import { sortAvailableTemplates } from '../sortAvailableTemplates.js';

describe('sortAvailableTemplates', () => {
  it('sorts by searchLabel and keeps value and color', () => {
    const input = [
      { searchLabel: 'Zeta', value: 'z', color: '#111' },
      { searchLabel: 'Apple', value: 'a', color: '#222' },
      { searchLabel: 'Mango', value: 'm', color: '#333' },
    ];

    expect(sortAvailableTemplates(input, 'en')).toEqual([
      { searchLabel: 'Apple', value: 'a', color: '#222' },
      { searchLabel: 'Mango', value: 'm', color: '#333' },
      { searchLabel: 'Zeta', value: 'z', color: '#111' },
    ]);
  });

  it('sorts accented Spanish labels with the UI locale', () => {
    const input = [
      { searchLabel: 'Árbol', value: 'arbol', color: '#aaa' },
      { searchLabel: 'Nube', value: 'nube', color: '#bbb' },
      { searchLabel: 'Casa', value: 'casa', color: '#ccc' },
    ];
    const byCodePoint = [...input].sort((left, right) => {
      if (left.searchLabel > right.searchLabel) return 1;
      if (left.searchLabel < right.searchLabel) return -1;
      return 0;
    });

    expect(byCodePoint.map(item => item.searchLabel)).toEqual(['Casa', 'Nube', 'Árbol']);
    expect(sortAvailableTemplates(input, 'es')).toEqual([
      { searchLabel: 'Árbol', value: 'arbol', color: '#aaa' },
      { searchLabel: 'Casa', value: 'casa', color: '#ccc' },
      { searchLabel: 'Nube', value: 'nube', color: '#bbb' },
    ]);
  });

  it('keeps input order for equal labels and does not mutate the input', () => {
    const input = [
      { searchLabel: 'Same', value: 'first', color: '#111' },
      { searchLabel: 'Same', value: 'second', color: '#222' },
      { searchLabel: 'Other', value: 'third' },
    ];
    const snapshot = input.map(item => ({ ...item }));

    expect(sortAvailableTemplates(input, 'en').map(item => item.value)).toEqual([
      'third',
      'first',
      'second',
    ]);
    expect(input).toEqual(snapshot);
  });
});
