import { tenants } from 'api/tenants';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { InvalidATServerResponse } from '../../errors/generateATErrors';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory';
import { Validator } from '../../infrastructure/Validator';
import { TranslationResult, translationResultSchema } from '../../types/TranslationResult';

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
