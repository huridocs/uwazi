import superagent from 'superagent';
import { APIURL } from 'app/config';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';

type Endpoint = 'attachment' | 'custom' | 'document';

class UploadService {
  private requests: superagent.SuperAgentRequest[] = [];

  private onProgressCallback:
    | ((filename: string, percent: number, total?: number) => void)
    | undefined;

  private onUploadCompleteCallback: ((response: FileType | FetchResponseError) => void) | undefined;

  private files: File[] = [];

  private endpoint: Endpoint | null = null;

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
  }

  public setFiles(files: File[]) {
    this.files = files;
  }

  public onUploadComplete(callback: (response: FileType | FetchResponseError) => void) {
    this.onUploadCompleteCallback = callback;
  }

  public onProgress(callback: (filename: string, percent: number, total?: number) => void) {
    this.onProgressCallback = callback;
  }

  public async start() {
    // eslint-disable-next-line max-statements
    const uploads: Promise<FileType | FetchResponseError>[] = this.files?.map(async file => {
      const route = `${APIURL}files/upload/${this.endpoint}`;
      const request = superagent
        .post(route)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', file)
        .on('progress', event => {
          if (this.onProgressCallback && event.percent) {
            this.onProgressCallback(file.name, Math.floor(event.percent), event.total);
          }
        });

      this.requests.push(request);

      try {
        const response = await request;
        if (this.onUploadCompleteCallback) {
          this.onUploadCompleteCallback(response.body as FileType);
        }
        return response.body as FileType;
      } catch (error) {
        if (this.onUploadCompleteCallback) {
          this.onUploadCompleteCallback(error as FetchResponseError);
        }
        return error as FetchResponseError;
      }
    });

    try {
      const responses = await Promise.all(uploads);
      return responses;
    } catch (error) {
      return error as FetchResponseError[];
    }
  }

  public abort() {
    this.requests.forEach(request => {
      request.abort();
    });
  }
}

export { UploadService };
