import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';

export const CHART_FOREGROUND = '#1a1a1a';

export const chartTextStyle = (appearance: DatavizAppearance) => ({
  color: appearance.themeColors?.foreground ?? CHART_FOREGROUND,
  fontSize: 12,
});
