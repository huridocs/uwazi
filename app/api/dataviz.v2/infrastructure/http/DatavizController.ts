import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { mapDatavizHttpErrors } from './mapDatavizHttpErrors.js';

abstract class DatavizController<RequestBody = any> extends AbstractController<RequestBody> {
  async handleAsync() {
    try {
      await this.handle();
    } catch (error) {
      if (mapDatavizHttpErrors(error, this.response)) {
        return;
      }
      throw error;
    }
  }
}

export { DatavizController };
