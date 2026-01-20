import { tenants } from '#api/tenants/index.js';

import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';

import { permissionsContext } from '#api/permissions/permissionsContext.js';

import { InvalidATServerResponse } from '#api/externalIntegrations.v2/automaticTranslation/errors/generateATErrors.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { Validator } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/Validator.js';
import {
  TranslationResult,
  translationResultSchema,
} from '#api/externalIntegrations.v2/automaticTranslation/types/TranslationResult.js';

export class ATServiceListener {
  static SERVICE_NAME = 'translations';

  private taskManager: TaskManager;

  constructor(ATFactory: typeof AutomaticTranslationFactory = AutomaticTranslationFactory) {
    const validator = new Validator<TranslationResult>(translationResultSchema);
    this.taskManager = new TaskManager({
      serviceName: ATServiceListener.SERVICE_NAME,
      processResults: async result => {
        if (!validator.validate(result)) {
          throw new InvalidATServerResponse(validator.getErrors()[0].message, {
            cause: validator.getErrors()[0],
          });
        }

        await tenants.run(async () => {
          permissionsContext.setCommandContext();
          await ATFactory.defaultSaveEntityTranslations().execute(result);
        }, result.key[0]);
      },
    });
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}
