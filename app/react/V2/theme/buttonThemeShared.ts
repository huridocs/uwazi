import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';

function getAccessibleForeground(background: string, foreground: string, minimumContrast?: number) {
  return getAccessibleForegroundOnBackground(background, foreground, minimumContrast).foreground;
}

export { getAccessibleForeground };
