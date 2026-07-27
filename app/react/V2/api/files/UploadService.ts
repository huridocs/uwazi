import superagent, { MultipartValueSingle, SuperAgentRequest } from 'superagent';
import { APIURL } from '#app/config.js';
import { FileType } from '#shared/types/fileType.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

type Endpoint = 'attachment' | 'custom' | 'document' | 'createFromPDF';

class UploadService {
  private requests: SuperAgentRequest[] = [];

  private aborted: boolean = false;

  private onProgressCallback:
    ((filename: string, percent: number, total?: number) => void) | undefined;

  private onUploadCompleteCallback: ((response: FileType | FetchResponseError) => void) | undefined;

  private filesQueue: File[] = [];

  private route: string;

  private extraFields: Record<string, string>;

  constructor(endpoint: Endpoint, extraFields: Record<string, string> = {}) {
    if (endpoint === 'createFromPDF') {
      this.route = `${APIURL}entities/create-from-pdf`;
    } else {
      this.route = `${APIURL}files/upload/${endpoint}`;
    }
    this.extraFields = extraFields;
  }

  // eslint-disable-next-line max-statements
  private async uploadQueue(files: File[], responses: (FileType | FetchResponseError)[]) {
    if (this.aborted) {
      this.aborted = false;
      return;
    }

    if (files.length === 0) return;

    const file = files.shift()!;
    const { originalname: customOriginalName, ...restFields } = this.extraFields;

    const request = superagent
      .post(this.route)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('originalname', customOriginalName ?? file.name)
      .attach('file', file as unknown as MultipartValueSingle)
      .on('progress', event => {
        const { percent } = event;
        if (this.onProgressCallback && typeof percent === 'number' && Number.isFinite(percent)) {
          this.onProgressCallback(file.name, Math.floor(percent), event.total);
        }
      });
    Object.entries(restFields).forEach(([key, value]) => {
      request.field(key, value);
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
      this.requests = [];
      return responses;
    }
    return [];
  }

  public getFilesInQueue() {
    return this.filesQueue;
  }

  public abort() {
    this.aborted = true;
    this.requests.forEach(request => request.abort());
  }

  public isUploading() {
    return Boolean(this.requests.length);
  }
}

export { UploadService };
