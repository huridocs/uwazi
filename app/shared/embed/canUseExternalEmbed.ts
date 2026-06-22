type EmbedSettings = {
  private?: boolean;
};

/** External embed is always allowed on public instances; on private instances only when flagged. */
export const canUseExternalEmbed = (
  settings: EmbedSettings,
  embedPublic = false
): boolean => !settings.private || embedPublic;
