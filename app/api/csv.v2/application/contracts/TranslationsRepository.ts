export interface TranslationsRepository {
  updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: Record<string, Record<string, string>>,
    contextLabel?: string
  ): Promise<void>;
}
