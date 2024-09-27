import { tenants } from 'api/tenants';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { ATTranslationResultValidator } from '../../contracts/ATTranslationResultValidator';
import { AJVTranslationResultValidator } from '../../infrastructure/AJVTranslationResultValidator';
import { InvalidATServerResponse } from '../../errors/generateATErrors';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory';

export class ATServiceListener {
  static SERVICE_NAME = 'AutomaticTranslation';

  private taskManager: TaskManager;

  constructor(ATFactory: typeof AutomaticTranslationFactory = AutomaticTranslationFactory) {
    const validator: ATTranslationResultValidator = new AJVTranslationResultValidator();
    this.taskManager = new TaskManager({
      serviceName: ATServiceListener.SERVICE_NAME,
      processResults: async result => {
        if (!validator.validate(result)) {
          throw new InvalidATServerResponse(validator.getErrors()[0]);
        }

        await tenants.run(async () => {
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
