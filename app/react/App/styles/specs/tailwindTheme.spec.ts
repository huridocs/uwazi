import { readFileSync } from 'fs';

const theme = readFileSync('app/react/App/styles/tailwind.css', 'utf8');
const inputField = readFileSync('app/react/V2/Components/Forms/InputField.tsx', 'utf8');

describe('tailwind @theme carbon', () => {
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
