type EmbedSettings = {
  private?: boolean;
};

export const canUseExternalEmbed = (settings: EmbedSettings): boolean => !settings.private;
