import { FileContents } from 'api/files.v2/model/FileContents';
import superagent from 'superagent';
import { GetInput, HttpClient, PostFormDataInput } from '../contracts/HttpClient';
import { HttpField } from '../contracts/HttpField';

export class SuperAgentHttpClient implements HttpClient {
  private client = superagent;

  async get<Response>(input: GetInput): Promise<Response> {
    const response = await this.client.get(input.url);

    return response.body as Response;
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
    files: Record<string, FileContents[]>
  ) {
    const promises = Object.entries(files).flatMap(([key, _files]) =>
      _files.map(async file => {
        const buffer = (await file.toBuffer()).getDataOrThrow();

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
