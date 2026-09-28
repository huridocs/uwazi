import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import urljoin from 'url-join';
import { z } from 'zod';
import type { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { PdfSegmenter, SegmentationRequest } from '../../application/contracts/PdfSegmenter.js';
import { OutcomeHandle } from '../../application/contracts/SegmentationOutcome.js';
import { MalformedSegmentationResult } from '../../application/errors/MalformedSegmentationResult.js';
import { SegmentationServiceNotConfigured } from '../../application/errors/SegmentationServiceNotConfigured.js';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { DocumentLayoutTranslator } from './DocumentLayoutTranslator.js';
import { ServiceFailure } from './ServiceFailure.js';
import { WireOutcomeHandle, WireTaskMessage } from './wireTypes.js';

type TaskQueue = Pick<TaskManager<WireTaskMessage>, 'startTask' | 'countPendingTasks'>;

/** The HTTP calls the service needs: a multipart upload, a JSON read and a streamed read. */
type HttpClient = {
  uploadFile(url: string, filename: string, content: Buffer): Promise<unknown>;
  getJson(url: string): Promise<{ json: unknown }>;
  fetch(url: string): Promise<Response>;
};

type Deps = {
  tenant: string;
  /** The `segmentation` feature's url; the service's upload endpoint. */
  serviceUrl: () => Promise<string | undefined>;
  taskQueue: TaskQueue;
  http: HttpClient;
};

const WireOutcomeHandleSchema = z.object({ dataUrl: z.string(), fileUrl: z.string() });

/**
 * The layout analysis service behind the `PdfSegmenter` port. A request is two steps: the PDF is
 * uploaded to the tenant's space, then a task naming it is queued in Redis. Results come back on
 * the results queue, and each is fetched — once — from the urls it carries.
 */
class RemotePdfSegmenter implements PdfSegmenter {
  constructor(private readonly deps: Deps) {}

  async submit({ key, filename, content }: SegmentationRequest): Promise<void> {
    const url = await this.deps.serviceUrl();
    if (!url) {
      throw new SegmentationServiceNotConfigured();
    }

    try {
      await this.deps.http.uploadFile(urljoin(url, this.deps.tenant), filename, content);
    } catch (error) {
      throw ServiceFailure.ofUpload(error);
    }

    await this.deps.taskQueue.startTask({
      task: 'segmentation',
      tenant: this.deps.tenant,
      params: { filename, idempotency_key: key.toString() },
    });
  }

  async backlogSize(): Promise<number> {
    return this.deps.taskQueue.countPendingTasks();
  }

  async fetchLayout(handle: OutcomeHandle): Promise<{ layout: DocumentLayout; xml: Readable }> {
    const { dataUrl, fileUrl } = RemotePdfSegmenter.wireHandle(handle);

    const layout = DocumentLayoutTranslator.toDomain(await this.fetchData(dataUrl));
    const xml = await this.fetchXml(fileUrl);

    return { layout, xml };
  }

  private static wireHandle(handle: OutcomeHandle): WireOutcomeHandle {
    const parsed = WireOutcomeHandleSchema.safeParse(handle);
    if (!parsed.success) {
      throw new MalformedSegmentationResult('an outcome handle this segmenter did not produce');
    }
    return parsed.data;
  }

  /** The service answers with its JSON encoded a second time, as a string. */
  private async fetchData(dataUrl: string): Promise<unknown> {
    let body: unknown;
    try {
      ({ json: body } = await this.deps.http.getJson(dataUrl));
    } catch (error) {
      throw ServiceFailure.ofResultFetch(error);
    }

    if (typeof body !== 'string') {
      return body;
    }
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new MalformedSegmentationResult('extraction data is not json', error);
    }
  }

  private async fetchXml(fileUrl: string): Promise<Readable> {
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
      throw new MalformedSegmentationResult('the xml response has no body');
    }
    return RemotePdfSegmenter.asReadable(response.body);
  }

  /**
   * Processes run with `--no-experimental-fetch`, so `fetch` is a polyfill whose body is already a
   * Node stream; native fetch hands out a web stream instead.
   */
  private static asReadable(body: unknown): Readable {
    return body instanceof Readable ? body : Readable.fromWeb(body as ReadableStream);
  }
}

export { RemotePdfSegmenter };
export type { HttpClient };
