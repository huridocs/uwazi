import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import request from '#shared/JSONRequest.js';
import { PdfSegmenter } from '../../application/contracts/PdfSegmenter.js';
import { HttpClient, RemotePdfSegmenter } from '../layoutAnalysisService/RemotePdfSegmenter.js';
import { WireTaskMessage } from '../layoutAnalysisService/wireTypes.js';

const SERVICE_NAME = 'segmentation';

const http: HttpClient = {
  uploadFile: async (url, filename, content) => request.uploadFile(url, filename, content),
  getJson: async url => request.get(url),
  fetch: async url => fetch(url),
};

class PdfSegmenterFactory {
  private static taskManager: TaskManager<WireTaskMessage> | undefined;

  static default(): PdfSegmenter {
    const settingsDS = SettingsDataSourceFactory.default();

    return new RemotePdfSegmenter({
      tenant: ExecutionContext.currentTenant.name,
      serviceUrl: async () => (await settingsDS.readFeature('segmentation'))?.url,
      taskQueue: PdfSegmenterFactory.sharedTaskManager(),
      http,
    });
  }

  /**
   * One sender per process, as the old dispatch loop had. Built on first use rather than at
   * import, so it takes the Redis client connected by then.
   */
  private static sharedTaskManager() {
    PdfSegmenterFactory.taskManager ??= new TaskManager<WireTaskMessage>({
      serviceName: SERVICE_NAME,
    });
    return PdfSegmenterFactory.taskManager;
  }
}

export { PdfSegmenterFactory };
