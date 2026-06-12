import { FileContents } from '#api/core/domain/files/FileContents.js';
import { HttpField } from './HttpField.js';

type PostFormDataInput = {
  url: string;
  fields: Record<string, HttpField>;
  files: Record<string, { filename: string; contents: FileContents }[]>;
};

type GetInput = {
  url: string;
};

type PostJsonInput = {
  url: string;
  body: unknown;
};

type DeleteJsonInput = {
  url: string;
  body?: unknown;
};

interface HttpClient {
  postFormData<T>(input: PostFormDataInput): Promise<T>;
  postJson<Response>(input: PostJsonInput): Promise<Response>;
  delete(input: DeleteJsonInput): Promise<void>;
  get<Response>(input: GetInput): Promise<Response>;
}

export type { DeleteJsonInput, GetInput, HttpClient, PostFormDataInput, PostJsonInput };
