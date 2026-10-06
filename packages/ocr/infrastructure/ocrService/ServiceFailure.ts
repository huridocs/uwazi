import { OcrResultGone } from '../../application/errors/OcrResultGone.js';
import { OcrServiceUnavailable } from '../../application/errors/OcrServiceUnavailable.js';

const UNREACHABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);

type CallError = { code?: string; status?: number; cause?: { code?: string } };

/**
 * How the service fails, in the module's terms. It answers 404 when a result was already handed
 * out; a 5xx or no answer at all means it is down, which is worth retrying. Anything else is not a
 * failure of the service and is left as it is.
 */
class ServiceFailure {
  static ofCall(error: unknown): unknown {
    return ServiceFailure.isUnavailable(error) ? new OcrServiceUnavailable(error as Error) : error;
  }

  static ofResultFetch(error: unknown): unknown {
    const { status } = (error ?? {}) as CallError;
    return status === 404 ? new OcrResultGone(error as Error) : ServiceFailure.ofCall(error);
  }

  static ofResponse(status: number): Error {
    return Object.assign(new Error(`The OCR service answered ${status}`), { status });
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
