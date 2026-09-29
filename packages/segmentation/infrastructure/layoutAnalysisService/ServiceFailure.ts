import { SegmentationResultGone } from '../../application/errors/SegmentationResultGone.js';
import { SegmentationServiceUnavailable } from '../../application/errors/SegmentationServiceUnavailable.js';

const UNREACHABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);

type CallError = { code?: string; status?: number; cause?: { code?: string } };

/**
 * How the service fails, in the module's terms. It answers 404 when a layout was already handed
 * out and 422 when the xml is gone; a 5xx or no answer at all means it is down, which is worth
 * retrying. Anything else is not a failure of the service and is left as it is.
 */
class ServiceFailure {
  static ofUpload(error: unknown): unknown {
    return ServiceFailure.isUnavailable(error)
      ? new SegmentationServiceUnavailable(error as Error)
      : error;
  }

  static ofResultFetch(error: unknown): unknown {
    const { status } = error as CallError;
    if (status === 404 || status === 422) {
      return new SegmentationResultGone(error as Error);
    }
    return ServiceFailure.ofUpload(error);
  }

  static ofResponse(status: number): Error {
    return Object.assign(new Error(`The segmentation service answered ${status}`), { status });
  }

  private static isUnavailable(error: unknown) {
    const { code, status, cause } = (error ?? {}) as CallError;
    return (
      UNREACHABLE_CODES.has(code ?? '') ||
      UNREACHABLE_CODES.has(cause?.code ?? '') ||
      (status !== undefined && status >= 500)
    );
  }
}

export { ServiceFailure };
