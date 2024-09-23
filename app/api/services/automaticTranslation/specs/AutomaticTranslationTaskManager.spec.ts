import {
  ATConfig,
  ATTemplateConfig,
} from 'api/externalIntegrations.v2/automaticTranslation/model/ATConfig';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';

export interface TranslationRequest {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
}

class AutomaticTranslationTaskManager {
  static SERVICE_NAME = 'AutomaticTranslation';

  private taskManager: TaskManager;

  constructor(taskManager: TaskManager) {
    this.taskManager = taskManager;
  }

  translateEntity(entity) { }
}

describe('AutomaticTranslationTaskManager', () => {
  it('should send a task in the automatic translation service queue', async () => {
    const entity = {};
    const taskManager = new TaskManager({
      serviceName: AutomaticTranslationTaskManager.SERVICE_NAME,
      processResults: () => { },
    });

    const automaticTranslationTaskManager = new AutomaticTranslationTaskManager(taskManager);

    const config = new ATConfig(
      true,
      ['es', 'en'],
      [new ATTemplateConfig('template1', ['title'], ['text1', 'empty_text'])]
    );

    await automaticTranslationTaskManager.tranlateEntity(entity, config);

    expect(taskManager.startTask).toHaveBeenCalledWith({
      key: ['tenant', 'entity1', 'title'],
      text: 'original title',
      language_from: 'en',
      languages_to: ['es'],
    });

    expect(taskManager.startTask).toHaveBeenCalledWith({
      key: ['tenant', 'entity1', 'text1'],
      text: 'original text1',
      language_from: 'en',
      languages_to: ['es'],
    });

    // expect(taskManager.startTask).toHaveBeenCalledWith({
    //   key: ['tenant', 'entity1', 'text2'],
    //   text: 'original text2',
    //   language_from: 'en',
    //   languages_to: ['es'],
    // });
  });
});
