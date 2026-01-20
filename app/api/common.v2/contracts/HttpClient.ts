import { FileContents } from '#api/core/domain/files/FileContents.js';
import { HttpField } from '#api/common.v2/contracts/HttpField.js';

type PostFormDataInput = {
  url: string;
  fields: Record<string, HttpField>;
  files: Record<string, { filename: string; contents: FileContents }[]>;
};

type GetInput = {
  url: string;
};

interface HttpClient {
  postFormData<T>(input: PostFormDataInput): Promise<T>;
  get<Response>(input: GetInput): Promise<Response>;
}

export type { GetInput, HttpClient, PostFormDataInput };
