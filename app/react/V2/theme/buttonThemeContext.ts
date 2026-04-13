import { mixHex } from '#shared/utils/contrast.js';
import {
  LEGACY_BUTTON_VALUES,
  getAccessibleForeground,
  getPresetResolvedValue,
  getPresetValue,
} from '#V2/theme/buttonThemeShared.js';
import { getStatusButtonContext } from '#V2/theme/buttonStatusContext.js';
import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';

type ButtonThemeContext = {
  isLegacy: boolean;
  resolved: ResolvedThemeVars;
  primaryBackground: string;
  primaryForeground: string;
  primaryDisabledBackground: string;
  primaryDisabledForeground: string;
  secondaryBackground: string;
  secondaryBorderOnSurface: string;
  secondaryTextOnButton: string;
  secondaryHoverBackground: string;
  ghostTextOnSurface: string;
  compactBackground: string;
  compactBorderOnBackground: string;
  compactTextOnBackground: string;
} & ReturnType<typeof getStatusButtonContext>;

const getPrimaryButtonContext = (presetId: ThemePresetId, resolved: ResolvedThemeVars) => {
  const isLegacy = presetId === 'legacy';
  const primaryBackground = getPresetResolvedValue(
    presetId,
    resolved,
    LEGACY_BUTTON_VALUES.primary,
    '--color-theme-text-primary'
  );
  const primaryForeground = getAccessibleForeground(
    primaryBackground,
    getPresetResolvedValue(
      presetId,
      resolved,
      LEGACY_BUTTON_VALUES.surface,
      '--color-theme-bg-primary'
    )
  );
  const primaryDisabledBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.primaryDisabled,
    mixHex(primaryBackground, resolved['--color-theme-bg-surface'], 0.35)
  );

  return {
    isLegacy,
    primaryBackground,
    primaryForeground,
    primaryDisabledBackground,
    primaryDisabledForeground: isLegacy
      ? LEGACY_BUTTON_VALUES.surface
      : getAccessibleForeground(primaryDisabledBackground, primaryForeground),
  };
};

const getSurfaceButtonContext = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  primaryBackground: string
) => {
  const isLegacy = presetId === 'legacy';
  const secondaryBackground = getPresetResolvedValue(
    presetId,
    resolved,
    LEGACY_BUTTON_VALUES.surface,
    '--color-theme-bg-surface'
  );
  const compactBackground = getPresetResolvedValue(
    presetId,
    resolved,
    LEGACY_BUTTON_VALUES.surfaceWarm,
    '--color-theme-bg-warm'
  );

  return {
    secondaryBackground,
    secondaryBorderOnSurface: isLegacy
      ? primaryBackground
      : getAccessibleForeground(
          resolved['--color-theme-bg-surface'],
          resolved['--color-theme-border-primary'],
          3
        ),
    secondaryTextOnButton: getAccessibleForeground(
      secondaryBackground,
      getPresetResolvedValue(presetId, resolved, primaryBackground, '--color-theme-text-secondary')
    ),
    secondaryHoverBackground: getPresetResolvedValue(
      presetId,
      resolved,
      LEGACY_BUTTON_VALUES.secondaryHover,
      '--color-theme-bg-warm'
    ),
    ghostTextOnSurface: getAccessibleForeground(
      resolved['--color-theme-bg-surface'],
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.text,
        '--color-theme-text-tertiary'
      )
    ),
    compactBackground,
    compactBorderOnBackground: getAccessibleForeground(
      compactBackground,
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.softBorder,
        '--color-theme-border-soft'
      ),
      3
    ),
    compactTextOnBackground: getAccessibleForeground(
      compactBackground,
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.text,
        '--color-theme-text-secondary'
      )
    ),
  };
};

const getButtonThemeContext = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): ButtonThemeContext => {
  const primaryContext = getPrimaryButtonContext(presetId, resolved);
  const surfaceContext = getSurfaceButtonContext(
    presetId,
    resolved,
    primaryContext.primaryBackground
  );

  return {
    resolved,
    ...primaryContext,
    ...surfaceContext,
    ...getStatusButtonContext(presetId, resolved, surfaceContext.secondaryBackground),
  };
};

export { LEGACY_BUTTON_VALUES, getButtonThemeContext };
export type { ButtonThemeContext };
