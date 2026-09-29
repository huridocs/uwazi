import type { SaveSettingsInput } from '#api/core/application/SaveSettings.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import type { SettingsOutput } from '../contracts.js';
import { GetSettingsController } from './GetSettingsController.js';

type UpdateSettingsCliInput = SaveSettingsInput;

/** Saves through the same use case as the admin UI, then prints the whole document. */
class UpdateSettingsController {
  static async handle(input: UpdateSettingsCliInput): Promise<SettingsOutput> {
    await SaveSettingsUseCaseFactory.default().execute(input);
    return GetSettingsController.handle();
  }
}

export { UpdateSettingsController };
export type { UpdateSettingsCliInput };
