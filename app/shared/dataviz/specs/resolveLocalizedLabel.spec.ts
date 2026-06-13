import { resolveLocalizedLabel } from '../resolveLocalizedLabel.js';

describe('resolveLocalizedLabel', () => {
  it('should prefer the requested locale', () => {
    const label = resolveLocalizedLabel(
      { label: 'Red', labels: { en: 'Red', es: 'Rojo' } },
      'es',
      'en'
    );

    expect(label).toBe('Rojo');
  });

  it('should fall back to default locale then legacy label', () => {
    expect(
      resolveLocalizedLabel({ label: 'Red', labels: { en: 'Red' } }, 'es', 'en')
    ).toBe('Red');

    expect(resolveLocalizedLabel({ label: 'Red' }, 'es', 'en')).toBe('Red');
  });
});
