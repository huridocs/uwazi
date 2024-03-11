import superagent, { SuperAgentRequest } from 'superagent';
import { APIURL } from 'app/config';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';

type Endpoint = 'attachment' | 'custom' | 'document';

class UploadService {
  private requests: SuperAgentRequest[] = [];

  private onProgressCallback:
    | ((filename: string, percent: number, total?: number) => void)
    | undefined;

  private onUploadCompleteCallback: ((response: FileType | FetchResponseError) => void) | undefined;

  private filesQueue: File[] = [];

  private route: string;

  constructor(endpoint: Endpoint) {
    this.route = `${APIURL}files/upload/${endpoint}`;
  }

  // eslint-disable-next-line max-statements
  private async uploadQueue(files: File[], responses: (FileType | FetchResponseError)[]) {
    if (files.length === 0) return;

    const file = files.shift()!;

    const request = superagent
      .post(this.route)
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
      responses.push(response.body as FileType);
      if (this.onUploadCompleteCallback) {
        this.onUploadCompleteCallback(response.body as FileType);
      }
    } catch (error) {
      responses.push(error as FetchResponseError);
      if (this.onUploadCompleteCallback) {
        this.onUploadCompleteCallback(error as FetchResponseError);
      }
    }

    await this.uploadQueue(files, responses);
  }

  public onUploadComplete(callback: (response: FileType | FetchResponseError) => void) {
    this.onUploadCompleteCallback = callback;
  }

  public onProgress(callback: (filename: string, percent: number, total?: number) => void) {
    this.onProgressCallback = callback;
  }

  public async upload(files: File[]) {
    this.filesQueue.push(...files);
    if (this.requests.length === 0) {
      const responses: (FileType | FetchResponseError)[] = [];
      await this.uploadQueue(this.filesQueue, responses);
      return responses;
    }
    return [];
  }

  public getFilesInQueue() {
    return this.filesQueue;
  }

  public abort() {
    this.requests.forEach(request => {
      request.abort();
    });
  }
}

export { UploadService };
