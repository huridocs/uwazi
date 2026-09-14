import {
  getAccessibleForegroundOnBackground,
  mixHex,
  WCAG_AA_LARGE_UI,
} from '#shared/utils/contrast.js';
import { getAccessibleForeground } from '#V2/theme/buttonThemeShared.js';
import type { ThemeRoles } from '#V2/theme/themeRoles.js';
import type { ThemePresetId } from '#V2/theme/themes.js';

type DangerSolidPair = {
  background: string;
  foreground: string;
  ratio: number;
};

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
  dangerSolid: DangerSolidPair;
};

const getStatusSecondaryTheme = ({
  roles,
  secondaryBackground,
  solid,
}: {
  roles: ThemeRoles;
  secondaryBackground: string;
  solid: string;
}) => ({
  borderOnSurface: getAccessibleForeground(roles.surface.raised, solid, 3),
  foregroundOnSecondary: getAccessibleForeground(secondaryBackground, solid),
});

const getStatusButtonContext = (
  _presetId: ThemePresetId,
  secondaryBackground: string,
  roles: ThemeRoles
): ButtonStatusContext => {
  const successSolidBackground = roles.feedback.success;
  const successSolidForeground = getAccessibleForegroundOnBackground(
    successSolidBackground,
    '#FFFFFF',
    WCAG_AA_LARGE_UI
  ).foreground;
  const successDisabledBackground = mixHex(successSolidBackground, roles.surface.raised, 0.35);
  const successSecondaryTheme = getStatusSecondaryTheme({
    roles,
    secondaryBackground,
    solid: roles.feedback.success,
  });
  const dangerSecondaryTheme = getStatusSecondaryTheme({
    roles,
    secondaryBackground,
    solid: roles.feedback.danger,
  });

  return {
    successSolidBackground,
    successSolidForeground,
    successHoverBackground: mixHex(successSolidBackground, '#000000', 0.08),
    successDisabledBackground,
    successDisabledForeground: getAccessibleForeground(
      successDisabledBackground,
      successSolidForeground
    ),
    successSecondaryBackground: secondaryBackground,
    successOnSecondaryBackground: successSecondaryTheme.foregroundOnSecondary,
    successBorderOnSurface: successSecondaryTheme.borderOnSurface,
    dangerSecondaryBackground: secondaryBackground,
    dangerOnSecondaryBackground: dangerSecondaryTheme.foregroundOnSecondary,
    dangerBorderOnSurface: dangerSecondaryTheme.borderOnSurface,
    successOnSuccessTint: getAccessibleForeground(
      roles.feedback.successTint,
      roles.feedback.success
    ),
    dangerOnDangerTint: getAccessibleForeground(roles.feedback.dangerTint, roles.feedback.danger),
    dangerSolid: (() => {
      const background = roles.feedback.danger;
      const { foreground, ratio } = getAccessibleForegroundOnBackground(
        background,
        '#FFFFFF',
        WCAG_AA_LARGE_UI
      );
      return { background, foreground, ratio };
    })(),
  };
};

export { getStatusButtonContext };
export type { ButtonStatusContext };
