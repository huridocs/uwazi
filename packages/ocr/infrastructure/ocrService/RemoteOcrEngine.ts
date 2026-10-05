import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import urljoin from 'url-join';
import { z } from 'zod';
import type { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { OcrEngine, OcrRequest, OutcomeHandle } from '../../application/contracts/OcrEngine.js';
import { MalformedOcrResult } from '../../application/errors/MalformedOcrResult.js';
import { OcrServiceNotConfigured } from '../../application/errors/OcrServiceNotConfigured.js';
import { ServiceFailure } from './ServiceFailure.js';
import { WireInfoSchema, WireOutcomeHandle, WireTaskMessage } from './wireTypes.js';

type TaskQueue = Pick<TaskManager<WireTaskMessage>, 'startTask' | 'countPendingTasks'>;

/** The HTTP calls the service needs: a multipart upload, a JSON read and a streamed read. */
type HttpClient = {
  uploadFile(url: string, filename: string, content: Buffer): Promise<unknown>;
  getJson(url: string): Promise<{ json: unknown }>;
  fetch(url: string): Promise<Response>;
};

type Deps = {
  tenant: string;
  /** The `ocr` feature's url; the service's base address. */
  serviceUrl: () => Promise<string | undefined>;
  taskQueue: TaskQueue;
  http: HttpClient;
};

const WireOutcomeHandleSchema = z.object({ fileUrl: z.string() });

/**
 * The OCR service behind the `OcrEngine` port. A request is two steps: the PDF is uploaded to the
 * tenant's space, then a task naming it is queued in Redis. Results come back on the results
 * queue, and each is fetched — once — from the url it carries.
 */
class RemoteOcrEngine implements OcrEngine {
  constructor(private readonly deps: Deps) {}

  async submit({ key, filename, language, content }: OcrRequest): Promise<void> {
    const url = await this.requireUrl();

    try {
      await this.deps.http.uploadFile(urljoin(url, 'upload', this.deps.tenant), filename, content);
    } catch (error) {
      throw ServiceFailure.ofCall(error);
    }

    await this.deps.taskQueue.startTask({
      task: 'ocr',
      tenant: this.deps.tenant,
      params: { filename, language, metadata: { key: key.toString() } },
    });
  }

  async backlogSize(): Promise<number> {
    return this.deps.taskQueue.countPendingTasks();
  }

  async fetchResult(handle: OutcomeHandle): Promise<{ pdf: Readable; mimetype: string }> {
    const { fileUrl } = RemoteOcrEngine.wireHandle(handle);

    let response: Response;
    try {
      response = await this.deps.http.fetch(fileUrl);
    } catch (error) {
      throw ServiceFailure.ofResultFetch(error);
    }

    if (!response.ok) {
      throw ServiceFailure.ofResultFetch(ServiceFailure.ofResponse(response.status));
    }
    if (!response.body) {
      throw new MalformedOcrResult('the result response has no body');
    }
    return {
      pdf: RemoteOcrEngine.asReadable(response.body),
      mimetype: response.headers.get('Content-Type') ?? 'application/pdf',
    };
  }

  async supportsLanguage(language: LanguageISO6391): Promise<boolean> {
    const url = await this.requireUrl();

    let body: unknown;
    try {
      ({ json: body } = await this.deps.http.getJson(urljoin(url, 'info')));
    } catch (error) {
      throw ServiceFailure.ofCall(error);
    }

    const info = WireInfoSchema.safeParse(body);
    if (!info.success) {
      throw new MalformedOcrResult('unexpected service info', info.error);
    }
    return info.data.supported_languages.includes(language);
  }

  private async requireUrl() {
    const url = await this.deps.serviceUrl();
    if (!url) {
      throw new OcrServiceNotConfigured();
    }
    return url;
  }

  private static wireHandle(handle: OutcomeHandle): WireOutcomeHandle {
    const parsed = WireOutcomeHandleSchema.safeParse(handle);
    if (!parsed.success) {
      throw new MalformedOcrResult('an outcome handle this engine did not produce');
    }
    return parsed.data;
  }

  /**
   * Processes run with `--no-experimental-fetch`, so `fetch` is a polyfill whose body is already a
   * Node stream; native fetch hands out a web stream instead.
   */
  private static asReadable(body: unknown): Readable {
    return body instanceof Readable ? body : Readable.fromWeb(body as ReadableStream);
  }
}

export { RemoteOcrEngine };
export type { HttpClient };
