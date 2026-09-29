import { SettingsDocumentQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsDocumentQueryServiceFactory.js';
import type { SettingsOutput } from '../contracts.js';

/** The whole stored settings document; a tenant without settings prints `{}`. */
class GetSettingsController {
  static async handle(): Promise<SettingsOutput> {
    const document = await SettingsDocumentQueryServiceFactory.default().get();
    return { ...document };
  }
}

export { GetSettingsController };
