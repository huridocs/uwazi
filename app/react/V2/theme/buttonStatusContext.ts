import { getAccessibleColorPair, mixHex } from '#shared/utils/contrast.js';
import {
  LEGACY_BUTTON_VALUES,
  getAccessibleForeground,
  getPresetResolvedValue,
  getPresetValue,
} from '#V2/theme/buttonThemeShared.js';
import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';

type ButtonStatusContext = {
  successSolidBackground: string;
  successSolidForeground: string;
  successHoverBackground: string;
  successDisabledBackground: string;
  successDisabledForeground: string;
  successSecondaryBackground: string;
  successOnSecondaryBackground: string;
  successBorderOnSurface: string;
  dangerSecondaryBackground: string;
  dangerOnSecondaryBackground: string;
  dangerBorderOnSurface: string;
  successOnSuccessTint: string;
  dangerOnDangerTint: string;
  dangerSolid: ReturnType<typeof getAccessibleColorPair>;
};

const getStatusSecondaryTheme = ({
  presetId,
  resolved,
  secondaryBackground,
  legacyColor,
  resolvedKey,
}: {
  presetId: ThemePresetId;
  resolved: ResolvedThemeVars;
  secondaryBackground: string;
  legacyColor: string;
  resolvedKey: keyof ResolvedThemeVars;
}) => {
  const solid = getPresetResolvedValue(presetId, resolved, legacyColor, resolvedKey);
  return {
    borderOnSurface: getAccessibleForeground(resolved['--color-theme-bg-surface'], solid, 3),
    foregroundOnSecondary: getAccessibleForeground(secondaryBackground, solid),
  };
};

const getStatusButtonContext = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  secondaryBackground: string
): ButtonStatusContext => {
  const successSolidBackground = getPresetResolvedValue(
    presetId,
    resolved,
    LEGACY_BUTTON_VALUES.success,
    '--color-theme-success'
  );
  const successSolidForeground = getAccessibleForeground(
    successSolidBackground,
    LEGACY_BUTTON_VALUES.surface
  );
  const successDisabledBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.successDisabled,
    mixHex(successSolidBackground, resolved['--color-theme-bg-surface'], 0.35)
  );
  const successSecondaryTheme = getStatusSecondaryTheme({
    presetId,
    resolved,
    secondaryBackground,
    legacyColor: LEGACY_BUTTON_VALUES.success,
    resolvedKey: '--color-theme-success',
  });
  const dangerSecondaryTheme = getStatusSecondaryTheme({
    presetId,
    resolved,
    secondaryBackground,
    legacyColor: LEGACY_BUTTON_VALUES.danger,
    resolvedKey: '--color-theme-accent-emphasis',
  });

  return {
    successSolidBackground,
    successSolidForeground,
    successHoverBackground: getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.successHover,
      mixHex(successSolidBackground, '#000000', 0.08)
    ),
    successDisabledBackground,
    successDisabledForeground: getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.surface,
      getAccessibleForeground(successDisabledBackground, successSolidForeground)
    ),
    successSecondaryBackground: secondaryBackground,
    successOnSecondaryBackground: successSecondaryTheme.foregroundOnSecondary,
    successBorderOnSurface: successSecondaryTheme.borderOnSurface,
    dangerSecondaryBackground: secondaryBackground,
    dangerOnSecondaryBackground: dangerSecondaryTheme.foregroundOnSecondary,
    dangerBorderOnSurface: dangerSecondaryTheme.borderOnSurface,
    successOnSuccessTint: getAccessibleForeground(
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.successTint,
        '--color-theme-success-light'
      ),
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.success,
        '--color-theme-success'
      )
    ),
    dangerOnDangerTint: getAccessibleForeground(
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.dangerTint,
        '--color-theme-accent-emphasis-tint'
      ),
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.danger,
        '--color-theme-accent-emphasis'
      )
    ),
    dangerSolid: getAccessibleColorPair(
      getPresetResolvedValue(
        presetId,
        resolved,
        LEGACY_BUTTON_VALUES.danger,
        '--color-theme-accent-emphasis'
      )
    ),
  };
};

export { getStatusButtonContext };
export type { ButtonStatusContext };
