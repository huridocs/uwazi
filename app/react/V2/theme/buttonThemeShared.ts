import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';

function getAccessibleForeground(background: string, foreground: string, minimumContrast?: number) {
  return getAccessibleForegroundOnBackground(background, foreground, minimumContrast).foreground;
}

const LEGACY_BUTTON_VALUES = {
  primary: '#2B56C1',
  primaryDisabled: '#A5B4FC',
  surface: '#FFFFFF',
  surfaceWarm: '#F9FAFB',
  border: '#E5E7EB',
  softBorder: '#D1D5DB',
  text: '#101828',
  ghostText: '#374151',
  secondaryHover: '#EEF2FF',
  success: '#15803D',
  successHover: '#166534',
  successDisabled: '#86EFAC',
  successTint: '#D1FAE5',
  danger: '#D9534F',
  dangerTint: '#FEE2E2',
} as const;

export { LEGACY_BUTTON_VALUES, getAccessibleForeground };
