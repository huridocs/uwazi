import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const theme = readFileSync('app/react/App/styles/tailwind.css', 'utf8');
const inputField = readFileSync('app/react/V2/Components/Forms/InputField.tsx', 'utf8');

describe('tailwind @theme carbon', () => {
  it('uses a class-based dark variant on .tw-content', () => {
    expect(theme).toContain('@custom-variant dark (&:where(.dark, .dark *));');
  });

  it('rebinds @theme color aliases on .tw-content so :root light fallbacks are not the only definition', () => {
    const contentBlock = theme.match(/\.tw-content \{[\s\S]*?\n\}/)?.[0] ?? '';
    [
      '--color-ink:',
      '--color-paper:',
      '--color-carbon:',
      '--color-ink-tertiary:',
      '--color-warm:',
      '--color-border:',
    ].forEach(token => expect(contentBlock).toContain(token));
  });

  it('registers --color-carbon with the carbon utility fallback', () => {
    expect(theme).toMatch(/--color-carbon:\s*var\(--color-theme-accent-supporting,\s*#00b4f0\);/);
    expect(theme).toContain('@utility text-carbon');
    expect(theme).toContain('@utility bg-carbon');
    expect(theme).toContain('@utility border-carbon');
  });

  it('keeps InputField carbon opacity rings', () => {
    expect(inputField).toContain('ring-carbon/20');
  });
});
