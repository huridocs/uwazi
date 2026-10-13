import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { ActivityLogEntry } from '../domain/ActivityLogEntry.js';
import { ActivityLogDataSource } from './contracts/ActivityLogDataSource.js';

type Input = {
  method: string;
  /** The path alone, without the query string. */
  url: string;
  params: unknown;
  query: unknown;
  body: Record<string, unknown>;
  /** null for a request made without a user. */
  user: { id: string; username: string } | null;
  /** The status the request was answered with. */
  statusCode: number;
};

type Deps = {
  activityLogDS: ActivityLogDataSource;
};

const NOT_FOUND = 404;

/**
 * Logs one answered API request, when it is activity worth keeping: a request that changes
 * something. Reads, requests to endpoints that do not exist and the endpoints listed here are left
 * out.
 */
class RecordActivity extends AbstractUseCase<Input, void, Deps> {
  static readonly IGNORED_METHODS: readonly string[] = ['GET', 'OPTIONS', 'HEAD'];

  static readonly IGNORED_ENDPOINTS: readonly string[] = [
    '/api/login',
    '/api/contact',
    '/api/unlockaccount',
    '/api/resetpassword',
    '/api/recoverpassword',
    '/api/documents/pdfInfo',
    '/api/documents/download',
    '/api/attachments/download',
    '/api/semantic-search/notify-updates',
    '/api/sync',
    '/api/sync/upload',
    '/api/export',
  ];

  /** Endpoints whose requests are activity only when they arrive with a body. */
  static readonly BODY_REQUIRED_ENDPOINTS: readonly string[] = [
    '/api/files/upload/document',
    '/api/files/upload/custom',
    '/api/attachments/upload',
    '/api/public',
    '/api/entities',
    '/api/users',
  ];

  async execute(input: Input): Promise<void> {
    if (!RecordActivity.isActivity(input)) return;

    const { statusCode: _statusCode, ...request } = input;

    await this.deps.activityLogDS.append(
      ActivityLogEntry.record({ ...request, id: this.idGenerator.generate(), time: Date.now() })
    );
  }

  private static isActivity({ method, url, body, statusCode }: Input): boolean {
    if (statusCode === NOT_FOUND) return false;

    const isLoggedRequest =
      url.includes('/api/') &&
      !RecordActivity.IGNORED_METHODS.includes(method) &&
      !RecordActivity.IGNORED_ENDPOINTS.includes(url);

    const hasTheBodyItNeeds =
      !RecordActivity.BODY_REQUIRED_ENDPOINTS.includes(url) || JSON.stringify(body) !== '{}';

    return isLoggedRequest && hasTheBodyItNeeds;
  }
}

export { RecordActivity };
export type { Input as RecordActivityInput };
