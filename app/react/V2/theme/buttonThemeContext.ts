import { mixHex } from '#shared/utils/contrast.js';
import { getAccessibleForeground } from '#V2/theme/buttonThemeShared.js';
import { getStatusButtonContext } from '#V2/theme/buttonStatusContext.js';
import type { ThemeRoles } from '#V2/theme/themeRoles.js';
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

const getPrimaryButtonContext = (
  _presetId: ThemePresetId,
  _resolved: ResolvedThemeVars,
  roles: ThemeRoles
) => {
  const primaryBackground = roles.action.primary;
  const primaryForeground = roles.action.primaryFg;
  const primaryDisabledBackground = mixHex(primaryBackground, roles.surface.raised, 0.35);

  return {
    primaryBackground,
    primaryForeground,
    primaryDisabledBackground,
    primaryDisabledForeground: getAccessibleForeground(
      primaryDisabledBackground,
      primaryForeground
    ),
  };
};

const getSurfaceButtonContext = (
  presetId: ThemePresetId,
  _resolved: ResolvedThemeVars,
  _primaryBackground: string,
  roles: ThemeRoles
) => {
  const isLegacy = presetId === 'legacy';
  const secondaryBackground = roles.action.secondaryBg;
  const compactBackground = roles.surface.warm;

  return {
    secondaryBackground,
    secondaryBorderOnSurface: isLegacy
      ? roles.border.interactive
      : getAccessibleForeground(roles.surface.raised, roles.border.default, 3),
    secondaryTextOnButton: getAccessibleForeground(secondaryBackground, roles.action.secondaryFg),
    secondaryHoverBackground: roles.action.secondaryHover,
    ghostTextOnSurface: getAccessibleForeground(roles.surface.raised, roles.text.tertiary),
    compactBackground,
    compactBorderOnBackground: getAccessibleForeground(compactBackground, roles.border.soft, 3),
    compactTextOnBackground: getAccessibleForeground(compactBackground, roles.text.secondary),
  };
};

const getButtonThemeContext = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles
): ButtonThemeContext => {
  const primaryContext = getPrimaryButtonContext(presetId, resolved, roles);
  const surfaceContext = getSurfaceButtonContext(
    presetId,
    resolved,
    primaryContext.primaryBackground,
    roles
  );

  return {
    isLegacy: presetId === 'legacy',
    resolved,
    ...primaryContext,
    ...surfaceContext,
    ...getStatusButtonContext(presetId, surfaceContext.secondaryBackground, roles),
  };
};

export { getButtonThemeContext };
export type { ButtonThemeContext };
