import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import request from '#shared/JSONRequest.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { HttpClient, RemoteOcrEngine } from '../ocrService/RemoteOcrEngine.js';
import { WireTaskMessage } from '../ocrService/wireTypes.js';

const SERVICE_NAME = 'ocr';

const http: HttpClient = {
  uploadFile: async (url, filename, content) => request.uploadFile(url, filename, content),
  getJson: async url => request.get(url),
  fetch: async url => fetch(url),
};

class OcrEngineFactory {
  private static taskManager: TaskManager<WireTaskMessage> | undefined;

  static default(): OcrEngine {
    const settingsDS = SettingsDataSourceFactory.default();

    return new RemoteOcrEngine({
      tenant: ExecutionContext.currentTenant.name,
      serviceUrl: async () => (await settingsDS.readFeature('ocr'))?.url,
      taskQueue: OcrEngineFactory.sharedTaskManager(),
      http,
    });
  }

  /**
   * One sender per process. Built on first use rather than at import, so it takes the Redis
   * client connected by then.
   */
  private static sharedTaskManager() {
    OcrEngineFactory.taskManager ??= new TaskManager<WireTaskMessage>({
      serviceName: SERVICE_NAME,
    });
    return OcrEngineFactory.taskManager;
  }
}

export { OcrEngineFactory };
