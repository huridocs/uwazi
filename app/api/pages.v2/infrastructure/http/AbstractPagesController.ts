import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import {
  PageUnauthorizedError,
  PageNotFoundError,
  PageReleaseNotFoundError,
  UnknownPageLanguageKeysError,
  InvalidPageReleaseError,
  PageInUseByTemplatesError,
} from '#api/pages.v2/domain/errors.js';

abstract class AbstractPagesController<RequestBody = any> extends AbstractController<RequestBody> {
  static statusByErrorClass = [
    [PageUnauthorizedError, 401],
    [PageNotFoundError, 404],
    [PageReleaseNotFoundError, 404],
    [UnknownPageLanguageKeysError, 400],
    [InvalidPageReleaseError, 400],
    [PageInUseByTemplatesError, 409],
  ] as const;

  private mapPageHttpErrors = (error: unknown): boolean => {
    const match = AbstractPagesController.statusByErrorClass.find(
      ([ErrorClass]) => error instanceof ErrorClass
    );
    if (!match) {
      return false;
    }

    const [, status] = match;
    this.response.status(status).json({ message: (error as Error).message });

    return true;
  };

  protected abstract perform(): Promise<void>;

  protected async handle(): Promise<void> {
    try {
      await this.perform();
    } catch (error: unknown) {
      if (this.mapPageHttpErrors(error)) {
        return;
      }
      throw error;
    }
  }
}

export { AbstractPagesController };
