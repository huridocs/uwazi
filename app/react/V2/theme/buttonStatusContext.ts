import { getAccessibleColorPair, mixHex } from '#shared/utils/contrast.js';
import { LEGACY_BUTTON_VALUES, getAccessibleForeground } from '#V2/theme/buttonThemeShared.js';
import { getPresetValue } from '#V2/theme/themePresetUtils.js';
import type { ThemeRoles } from '#V2/theme/themeRoles.js';
import type { ThemePresetId } from '#V2/theme/themes.js';

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
  presetId: ThemePresetId,
  secondaryBackground: string,
  roles: ThemeRoles
): ButtonStatusContext => {
  const successSolidBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.success,
    roles.feedback.success
  );
  const successSolidForeground = getAccessibleForeground(
    successSolidBackground,
    roles.text.onSolid
  );
  const successDisabledBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.successDisabled,
    mixHex(successSolidBackground, roles.surface.raised, 0.35)
  );
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
    successHoverBackground: getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.successHover,
      mixHex(successSolidBackground, '#000000', 0.08)
    ),
    successDisabledBackground,
    successDisabledForeground: getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.successHover,
      getAccessibleForeground(successDisabledBackground, successSolidForeground)
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
    dangerSolid: getAccessibleColorPair(roles.feedback.danger),
  };
};

export { getStatusButtonContext };
export type { ButtonStatusContext };
