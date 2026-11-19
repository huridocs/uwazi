import { headerContrastChecks } from '../headerContrast.js';

describe('headerContrastChecks', () => {
  it('flags light header text on a light bar', () => {
    const checks = headerContrastChecks({
      '--color-theme-chrome-app-bar': '#FFFFFF',
      '--color-theme-chrome-app-bar-fg': '#F5F5F5',
      '--color-theme-chrome-app-bar-hover': '#FFFFFF',
      '--color-theme-chrome-app-bar-active': '#FFFFFF',
    });
    expect(checks.find(check => check.id === 'header-text')?.result.passesAA).toBe(false);
  });

  it('passes dark header text on a light bar', () => {
    const checks = headerContrastChecks({
      '--color-theme-chrome-app-bar': '#FFFFFF',
      '--color-theme-chrome-app-bar-fg': '#101828',
      '--color-theme-chrome-app-bar-hover': '#F9FAFB',
      '--color-theme-chrome-app-bar-active': '#F3F4F6',
    });
    expect(checks.every(check => check.result.passesAA)).toBe(true);
  });
});
