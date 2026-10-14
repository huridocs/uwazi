import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { ActivityLogEntry } from '../domain/ActivityLogEntry.js';
import { ActivityLogDataSource } from './contracts/ActivityLogDataSource.js';

type Input = {
  method: string;
  url: string;
  params: unknown;
  query: unknown;
  body: Record<string, unknown>;
  user: { id: string; username: string | null } | null;
  statusCode: number;
};

type Deps = {
  activityLogDS: ActivityLogDataSource;
};

const FIRST_FAILURE_STATUS = 400;

/**
 * Logs one answered API request, when it is activity worth keeping: a request that changed
 * something. Reads, requests that were refused or failed, and the endpoints listed here are left
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

  async execute(input: Input): Promise<void> {
    if (!RecordActivity.isActivity(input)) return;

    const { statusCode: _statusCode, ...request } = input;

    await this.deps.activityLogDS.append(
      ActivityLogEntry.record({ ...request, id: this.idGenerator.generate(), time: Date.now() })
    );
  }

  private static isActivity({ method, url, statusCode }: Input): boolean {
    if (statusCode >= FIRST_FAILURE_STATUS) return false;

    return (
      url.includes('/api/') &&
      !RecordActivity.IGNORED_METHODS.includes(method) &&
      !RecordActivity.IGNORED_ENDPOINTS.includes(url)
    );
  }
}

export { RecordActivity };
export type { Input as RecordActivityInput };
