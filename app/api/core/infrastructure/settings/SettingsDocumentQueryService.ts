/**
 * The whole stored settings document, for operator tooling: secrets (`sync`) and fields the
 * settings schema does not know are included, and no defaults are filled in. JSON-plain: ids
 * are strings.
 */
type SettingsDocument = Record<string, unknown>;

/** Feeds a presenter that shows and edits settings as stored, e.g. `uwazi settings get`. */
interface SettingsDocumentQueryService {
  /** undefined when the tenant has no settings yet. */
  get(): Promise<SettingsDocument | undefined>;
}

export type { SettingsDocument, SettingsDocumentQueryService };
