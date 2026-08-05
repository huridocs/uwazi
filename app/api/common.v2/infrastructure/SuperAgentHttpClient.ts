import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import superagent from 'superagent';
import type {
  DeleteJsonInput,
  GetInput,
  HttpClient,
  PostFormDataInput,
  PostJsonInput,
} from '../contracts/HttpClient.js';
import type { HttpField } from '../contracts/HttpField.js';

export class SuperAgentHttpClient implements HttpClient {
  private client = superagent;

  async get<Response>(input: GetInput): Promise<Response> {
    const response = await this.client.get(input.url);

    return response.body as Response;
  }

  async postJson<Response>(input: PostJsonInput): Promise<Response> {
    const response = await this.client.post(input.url).send(input.body);

    return response.body as Response;
  }

  async delete(input: DeleteJsonInput): Promise<void> {
    const request = this.client.delete(input.url);
    if (input.body !== undefined) {
      request.send(input.body);
    }
    await request;
  }

  async postFormData<T>(input: PostFormDataInput): Promise<T> {
    const request = this.client.post(input.url);

    await SuperAgentHttpClient.attachFiles(request, input.files);
    SuperAgentHttpClient.appendFields(request, input.fields);

    const response = await request;

    return response.body as T;
  }

  private static async attachFiles(
    request: superagent.Request,
    files: Record<string, { filename: string; contents: FileContents }[]>
  ) {
    const filesIO = new FileContentsIO();
    const promises = Object.entries(files).flatMap(([key, _files]) =>
      _files.map(async file => {
        const buffer = (await filesIO.toBuffer(file.contents)).getDataOrThrow();

        // This is necessary because when we actually 'await' for 'request.[attach/field]' the 'superagent' library kicks off the request
        // This is not what we want here.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        request.attach(key, buffer, file.filename);
      })
    );

    return Promise.all(promises);
  }

  private static appendFields(request: superagent.Request, fields: Record<string, HttpField>) {
    Object.entries(fields).forEach(([key, value]) => request.field(key, value.value));
  }
}
