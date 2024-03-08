import superagent from 'superagent';
import { APIURL } from 'app/config';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';

type Endpoint = 'attachment' | 'custom' | 'document';

class UploadService {
  private request: superagent.SuperAgentRequest | null = null;

  private onProgress: ((percent: number, total?: number) => void) | undefined;

  private file: File | null = null;

  private endpoint: Endpoint | null = null;

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
  }

  public setFile(file: File) {
    this.file = file;
  }

  public async start(onProgress?: (percent: number, total?: number) => void) {
    if (!this.file || !this.endpoint) {
      throw new Error('File and endpoint must be set before starting upload.');
    }

    this.onProgress = onProgress;

    const route = `${APIURL}files/upload/${this.endpoint}`;
    this.request = superagent
      .post(route)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .attach('file', this.file)
      .on('progress', event => {
        if (this.onProgress && event.percent) {
          this.onProgress(Math.floor(event.percent), event.total);
        }
      });

    try {
      const response = await this.request;
      return response.body as FileType;
    } catch (error) {
      return error as FetchResponseError;
    }
  }

  public abort() {
    if (this.request) {
      this.request.abort();
    }
  }
}
export { UploadService };
